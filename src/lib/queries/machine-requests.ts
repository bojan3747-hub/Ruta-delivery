import { pool, query, queryOne } from "../db";
import type { CourierRow, MachineOfferRow, MachineRequestRow, MachineType, Zone } from "../types";
import { getEffectiveMachineCommissionPercent } from "./commission";

// Faza 19c: klijentska strana angažovanja mašine — poseban tok od shipments
// (odluka korisnika: "poseban, ali ista logika"), zato posebna tabela i
// posebne funkcije ovde, po istom obrascu kao queries/shipments.ts.

export async function createMachineRequest(input: {
  clientId: string;
  zona: Zone;
  adresa: string;
  tipMasine: MachineType;
  opisPosla: string;
  zeljeniTermin?: string;
  kontaktIme?: string;
  kontaktTelefon?: string;
  napomena?: string;
}): Promise<MachineRequestRow> {
  const row = await queryOne<MachineRequestRow>(
    `INSERT INTO machine_requests (
       client_id, zona, adresa, tip_masine, opis_posla, zeljeni_termin,
       kontakt_ime, kontakt_telefon, napomena
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      input.clientId,
      input.zona,
      input.adresa,
      input.tipMasine,
      input.opisPosla,
      input.zeljeniTermin ?? null,
      input.kontaktIme ?? null,
      input.kontaktTelefon ?? null,
      input.napomena ?? null,
    ]
  );
  if (!row) throw new Error("Kreiranje zahteva za angažovanje mašine nije uspelo");
  return row;
}

export async function getMachineRequestById(
  id: string
): Promise<MachineRequestRow | null> {
  return queryOne<MachineRequestRow>(
    "SELECT * FROM machine_requests WHERE id = $1",
    [id]
  );
}

export async function listMachineRequestsByClient(
  clientId: string
): Promise<MachineRequestRow[]> {
  return query<MachineRequestRow>(
    "SELECT * FROM machine_requests WHERE client_id = $1 ORDER BY created_at DESC",
    [clientId]
  );
}

/**
 * Cancels a machine request — either the client (owner) or, once a
 * provider is assigned, the assigned provider may do this (mirrors
 * cancelOrder in queries/orders.ts). Before a provider is assigned (status
 * OTVOREN) only the client can cancel — there's no "order" yet for a
 * provider to cancel. After acceptance (PRIHVACENO / NA_LOKACIJI), either
 * side can cancel, with an optional reason.
 */
export async function cancelMachineRequest(
  requestId: string,
  actor: { clientId?: string; courierId?: string },
  razlog?: string
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const res = await client.query<MachineRequestRow>(
      "SELECT * FROM machine_requests WHERE id = $1 FOR UPDATE",
      [requestId]
    );
    const request = res.rows[0];
    if (!request) throw new Error("Zahtev nije pronađen");

    if (request.status === "OTVOREN") {
      if (!actor.clientId || request.client_id !== actor.clientId) {
        throw new Error("Nemate pravo da otkažete ovaj zahtev");
      }
    } else if (request.status === "PRIHVACENO" || request.status === "NA_LOKACIJI") {
      const allowed =
        (actor.clientId && request.client_id === actor.clientId) ||
        (actor.courierId && request.courier_id === actor.courierId);
      if (!allowed) throw new Error("Nemate pravo da otkažete ovaj zahtev");
    } else {
      throw new Error("Zahtev se više ne može otkazati u ovom statusu");
    }

    await client.query(
      `UPDATE machine_requests
       SET status = 'OTKAZANO', otkazano_razlog = $1, updated_at = now()
       WHERE id = $2`,
      [razlog ?? null, requestId]
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Client accepts one manual offer (Faza 19d): assigns the provider to the
 * request, records the agreed price, and rejects the other pending offers
 * — isti obrazac kao acceptOffer u queries/offers.ts.
 */
export async function acceptMachineOffer(
  requestId: string,
  offerId: string,
  clientId: string
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const reqRes = await client.query<MachineRequestRow>(
      "SELECT * FROM machine_requests WHERE id = $1 FOR UPDATE",
      [requestId]
    );
    const request = reqRes.rows[0];
    if (!request) throw new Error("Zahtev nije pronađen");
    if (request.client_id !== clientId) {
      throw new Error("Nemate pravo da prihvatite ponudu za ovaj zahtev");
    }
    if (request.status !== "OTVOREN") {
      throw new Error("Za ovaj zahtev je ponuda već prihvaćena ili je zahtev zatvoren");
    }

    const offerRes = await client.query<MachineOfferRow>(
      "SELECT * FROM machine_offers WHERE id = $1 AND machine_request_id = $2 FOR UPDATE",
      [offerId, requestId]
    );
    const offer = offerRes.rows[0];
    if (!offer) throw new Error("Ponuda nije pronađena");
    if (offer.status !== "POSLATA") {
      throw new Error("Ova ponuda više nije aktivna");
    }

    await client.query(
      `UPDATE machine_requests
       SET status = 'PRIHVACENO', courier_id = $1, accepted_offer_id = $2,
           cena = $3, updated_at = now()
       WHERE id = $4`,
      [offer.courier_id, offer.id, offer.cena, requestId]
    );
    await client.query("UPDATE machine_offers SET status = 'PRIHVACENA' WHERE id = $1", [
      offerId,
    ]);
    await client.query(
      `UPDATE machine_offers SET status = 'ODBIJENA'
       WHERE machine_request_id = $1 AND id <> $2 AND status = 'POSLATA'`,
      [requestId, offerId]
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

const NEXT_MACHINE_STATUS: Partial<Record<MachineRequestRow["status"], MachineRequestRow["status"]>> = {
  PRIHVACENO: "NA_LOKACIJI",
  NA_LOKACIJI: "ZAVRSENO",
};

/**
 * Advances an accepted machine request to its next status (Faza 19d) —
 * Prihvaćeno → Na lokaciji → Završeno, isti obrazac kao advanceOrder.
 * Komisija/faktura po ovom poslu ostaje za Fazu 19e (poseban procenat).
 */
export async function advanceMachineRequest(
  requestId: string,
  courierId: string
): Promise<MachineRequestRow> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const res = await client.query<MachineRequestRow>(
      "SELECT * FROM machine_requests WHERE id = $1 AND courier_id = $2 FOR UPDATE",
      [requestId, courierId]
    );
    const request = res.rows[0];
    if (!request) throw new Error("Zahtev nije pronađen");

    const next = NEXT_MACHINE_STATUS[request.status];
    if (!next) throw new Error("Ovo angažovanje je već završeno ili nije još prihvaćeno");

    let updated: MachineRequestRow;
    if (next === "ZAVRSENO") {
      // Faza 19e: obračun provizije po efektivnom procentu za mašine, isti
      // obrazac kao advanceOrder kad porudžbina pređe u ISPORUCENO.
      const courierRes = await client.query<CourierRow>(
        "SELECT * FROM couriers WHERE id = $1",
        [courierId]
      );
      const courier = courierRes.rows[0];
      if (!courier) throw new Error("Dostavljač nije pronađen");
      const { percent } = await getEffectiveMachineCommissionPercent(courier);
      const provizija = request.cena
        ? Math.round(Number(request.cena) * (percent / 100) * 100) / 100
        : null;
      const res2 = await client.query<MachineRequestRow>(
        `UPDATE machine_requests
         SET status = $1, updated_at = now(), zavrseno_at = now(), provizija = $2
         WHERE id = $3 RETURNING *`,
        [next, provizija, requestId]
      );
      updated = res2.rows[0];
    } else {
      const res2 = await client.query<MachineRequestRow>(
        `UPDATE machine_requests
         SET status = $1, updated_at = now(), na_lokaciji_at = now()
         WHERE id = $2 RETURNING *`,
        [next, requestId]
      );
      updated = res2.rows[0];
    }

    await client.query("COMMIT");
    return updated;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export interface OpenMachineRequestForCourier extends MachineRequestRow {
  client_naziv: string;
}

export interface MachineRequestWithClient extends MachineRequestRow {
  client_naziv: string;
}

/**
 * Open machine requests a provider can still send an offer for (Faza
 * 19d) — mora da pokriva zonu (courier_zones) I da nudi taj tip mašine
 * (courier_machines), isti obrazac kao listOpenRequestsForCourier.
 */
export async function listOpenMachineRequestsForCourier(
  courierId: string
): Promise<OpenMachineRequestForCourier[]> {
  return query<OpenMachineRequestForCourier>(
    `SELECT r.*, comp.naziv AS client_naziv
     FROM machine_requests r
     JOIN companies comp ON comp.id = r.client_id
     WHERE r.status = 'OTVOREN'
       AND EXISTS (SELECT 1 FROM courier_zones cz WHERE cz.courier_id = $1 AND cz.zone = r.zona)
       AND EXISTS (SELECT 1 FROM courier_machines cm WHERE cm.courier_id = $1 AND cm.tip_masine = r.tip_masine)
       AND NOT EXISTS (
         SELECT 1 FROM machine_offers o WHERE o.machine_request_id = r.id AND o.courier_id = $1
       )
     ORDER BY r.created_at ASC`,
    [courierId]
  );
}

/**
 * Angažovanja koja je OVAJ provajder prihvatio i još nisu završena.
 */
export async function listActiveMachineRequestsForCourier(
  courierId: string
): Promise<MachineRequestWithClient[]> {
  return query<MachineRequestWithClient>(
    `SELECT r.*, comp.naziv AS client_naziv
     FROM machine_requests r
     JOIN companies comp ON comp.id = r.client_id
     WHERE r.courier_id = $1 AND r.status IN ('PRIHVACENO', 'NA_LOKACIJI')
     ORDER BY r.created_at ASC`,
    [courierId]
  );
}

export async function listCompletedMachineRequestsForCourier(
  courierId: string
): Promise<MachineRequestWithClient[]> {
  return query<MachineRequestWithClient>(
    `SELECT r.*, comp.naziv AS client_naziv
     FROM machine_requests r
     JOIN companies comp ON comp.id = r.client_id
     WHERE r.courier_id = $1 AND r.status = 'ZAVRSENO'
     ORDER BY r.updated_at DESC
     LIMIT 20`,
    [courierId]
  );
}

export interface MachineRequestForOperator extends MachineRequestRow {
  client_naziv: string;
  courier_naziv: string | null;
}

/**
 * Faza 19e: svi zahtevi za angažovanje mašina, za operaterski pregled —
 * isti obrazac kao listAllOrdersForOperator. LEFT JOIN na couriers jer
 * zahtev dok je "Otvoren" još nema dodeljenog izvođača (courier_id NULL).
 */
export async function listAllMachineRequestsForOperator(): Promise<
  MachineRequestForOperator[]
> {
  return query<MachineRequestForOperator>(
    `SELECT r.*, comp.naziv AS client_naziv, c.naziv AS courier_naziv
     FROM machine_requests r
     JOIN companies comp ON comp.id = r.client_id
     LEFT JOIN couriers c ON c.id = r.courier_id
     ORDER BY r.created_at DESC`
  );
}

export async function getMachineRequestDetailForOperator(
  id: string
): Promise<MachineRequestForOperator | null> {
  return queryOne<MachineRequestForOperator>(
    `SELECT r.*, comp.naziv AS client_naziv, c.naziv AS courier_naziv
     FROM machine_requests r
     JOIN companies comp ON comp.id = r.client_id
     LEFT JOIN couriers c ON c.id = r.courier_id
     WHERE r.id = $1`,
    [id]
  );
}
