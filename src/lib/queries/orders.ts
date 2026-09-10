import { pool, query, queryOne } from "../db";
import type { OrderRow, OrderStatus, ShipmentRow } from "../types";
import { getActiveCommissionPercent } from "./commission";

/**
 * Puni skup podataka o pošiljci koji prati porudžbinu na svakom mestu gde
 * se porudžbina prikazuje — korisnik je prijavio da su detalji pošiljke
 * (sadržaj, pošiljalac/primalac, rok, napomena...) bili vidljivi SAMO dok
 * je zahtev otvoren (na /dostavljac/zahtevi), a nestajali čim dostavljač
 * prihvati/pošalje ponudu i zahtev postane porudžbina — na
 * /dostavljac/aktivne i kod operatera. Ovaj isti string se koristi u SVIM
 * upitima ispod da bi ostali sinhronizovani; dodavanje novog polja ovde ga
 * automatski provuče svuda.
 */
const SHIPMENT_DETAIL_COLUMNS = `
  s.zona_preuzimanja, s.zona_isporuke, s.adresa_preuzimanja, s.adresa_isporuke,
  s.posiljalac_ime, s.posiljalac_telefon, s.primalac_ime, s.primalac_telefon,
  s.tip, s.sadrzaj_posiljke, s.posebna_kategorija_tereta, s.hitno,
  s.nestandardna, s.zeljeni_termin, s.termin_detalji, s.napomena,
  s.deklarisana_vrednost, s.udaljenost_km
`;

export interface OrderWithShipment extends OrderRow {
  zona_preuzimanja: ShipmentRow["zona_preuzimanja"];
  zona_isporuke: ShipmentRow["zona_isporuke"];
  adresa_preuzimanja: string;
  adresa_isporuke: string;
  posiljalac_ime: ShipmentRow["posiljalac_ime"];
  posiljalac_telefon: ShipmentRow["posiljalac_telefon"];
  primalac_ime: ShipmentRow["primalac_ime"];
  primalac_telefon: ShipmentRow["primalac_telefon"];
  tip: ShipmentRow["tip"];
  sadrzaj_posiljke: ShipmentRow["sadrzaj_posiljke"];
  posebna_kategorija_tereta: ShipmentRow["posebna_kategorija_tereta"];
  hitno: ShipmentRow["hitno"];
  nestandardna: ShipmentRow["nestandardna"];
  zeljeni_termin: ShipmentRow["zeljeni_termin"];
  termin_detalji: ShipmentRow["termin_detalji"];
  napomena: ShipmentRow["napomena"];
  deklarisana_vrednost: ShipmentRow["deklarisana_vrednost"];
  udaljenost_km: ShipmentRow["udaljenost_km"];
  courier_naziv: string;
  courier_telefon: string;
  client_naziv?: string;
  client_kontakt_ime?: string;
  client_telefon?: string;
}

// Faza 9: pojednostavljeni tok — "U tranzitu" i "Na isporuci" su spojeni u
// jedan korak ("Preuzeo ponudu"), pa se sada ide direktno U_TRANZITU ->
// ISPORUCENO. NA_ISPORUCI ostaje mapiran na ISPORUCENO samo kao siguran
// fallback (da nijedna porudžbina ne ostane "zaglavljena" ako je slučajno
// zatečena u tom starom statusu) — od ove faze se novim porudžbinama više
// nikad ne dodeljuje, vidi migraciju u db/schema.sql.
const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  PREUZETO: "U_TRANZITU",
  U_TRANZITU: "ISPORUCENO",
  NA_ISPORUCI: "ISPORUCENO",
  ISPORUCENO: null,
  OTKAZANO: null,
};

export function nextOrderStatus(current: OrderStatus): OrderStatus | null {
  return NEXT_STATUS[current];
}

export async function getOrderById(id: string): Promise<OrderRow | null> {
  return queryOne<OrderRow>("SELECT * FROM orders WHERE id = $1", [id]);
}

export async function getOrderByShipmentId(
  shipmentId: string
): Promise<OrderRow | null> {
  return queryOne<OrderRow>("SELECT * FROM orders WHERE shipment_id = $1", [
    shipmentId,
  ]);
}

export async function listOrdersForClient(
  clientId: string
): Promise<OrderWithShipment[]> {
  return query<OrderWithShipment>(
    `SELECT o.*, ${SHIPMENT_DETAIL_COLUMNS}, c.naziv AS courier_naziv, c.telefon AS courier_telefon
     FROM orders o
     JOIN shipments s ON s.id = o.shipment_id
     JOIN couriers c ON c.id = o.courier_id
     WHERE s.client_id = $1
     ORDER BY o.created_at DESC`,
    [clientId]
  );
}

export async function listOrdersForCourier(
  courierId: string
): Promise<OrderWithShipment[]> {
  return query<OrderWithShipment>(
    `SELECT o.*, ${SHIPMENT_DETAIL_COLUMNS}, c.naziv AS courier_naziv, c.telefon AS courier_telefon,
            comp.naziv AS client_naziv, u.ime AS client_kontakt_ime, u.telefon AS client_telefon
     FROM orders o
     JOIN shipments s ON s.id = o.shipment_id
     JOIN couriers c ON c.id = o.courier_id
     JOIN companies comp ON comp.id = s.client_id
     JOIN users u ON u.id = comp.user_id
     WHERE o.courier_id = $1
       AND o.status NOT IN ('ISPORUCENO', 'OTKAZANO')
     ORDER BY o.created_at ASC`,
    [courierId]
  );
}

export interface CompletedOrderForCourier extends OrderWithShipment {
  client_naziv: string;
  client_rating_ocena: number | null;
  client_rating_komentar: string | null;
  has_fotografija: boolean;
}

export async function listCompletedOrdersForCourier(
  courierId: string
): Promise<CompletedOrderForCourier[]> {
  return query<CompletedOrderForCourier>(
    `SELECT o.*, ${SHIPMENT_DETAIL_COLUMNS}, c.naziv AS courier_naziv, c.telefon AS courier_telefon,
            comp.naziv AS client_naziv, r.ocena AS client_rating_ocena, r.komentar AS client_rating_komentar,
            (sf.id IS NOT NULL) AS has_fotografija
     FROM orders o
     JOIN shipments s ON s.id = o.shipment_id
     JOIN couriers c ON c.id = o.courier_id
     JOIN companies comp ON comp.id = s.client_id
     LEFT JOIN ratings r ON r.order_id = o.id AND r.smer = 'DOSTAVLJAC_KA_KLIJENTU'
     LEFT JOIN shipment_fotografije sf ON sf.shipment_id = s.id
     WHERE o.courier_id = $1 AND o.status = 'ISPORUCENO'
     ORDER BY o.updated_at DESC
     LIMIT 20`,
    [courierId]
  );
}

export async function listAllOrdersForOperator(): Promise<
  OrderWithShipment[]
> {
  return query<OrderWithShipment>(
    `SELECT o.*, ${SHIPMENT_DETAIL_COLUMNS}, c.naziv AS courier_naziv, c.telefon AS courier_telefon,
            comp.naziv AS client_naziv
     FROM orders o
     JOIN shipments s ON s.id = o.shipment_id
     JOIN couriers c ON c.id = o.courier_id
     JOIN companies comp ON comp.id = s.client_id
     ORDER BY o.created_at DESC`
  );
}

export async function getOrderDetailForOperator(
  orderId: string
): Promise<OrderWithShipment | null> {
  return queryOne<OrderWithShipment>(
    `SELECT o.*, ${SHIPMENT_DETAIL_COLUMNS},
            c.naziv AS courier_naziv, c.telefon AS courier_telefon,
            comp.naziv AS client_naziv, u.ime AS client_kontakt_ime, u.telefon AS client_telefon
     FROM orders o
     JOIN shipments s ON s.id = o.shipment_id
     JOIN couriers c ON c.id = o.courier_id
     JOIN companies comp ON comp.id = s.client_id
     JOIN users u ON u.id = comp.user_id
     WHERE o.id = $1`,
    [orderId]
  );
}

/**
 * Advances an order to the next delivery status (KAN-7). When it reaches
 * ISPORUCENO, marks the shipment finished and calculates the platform
 * commission for that order (KAN-12) using the currently active percentage.
 */
export async function advanceOrder(
  orderId: string,
  courierId: string
): Promise<OrderRow> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const orderRes = await client.query<OrderRow>(
      "SELECT * FROM orders WHERE id = $1 AND courier_id = $2 FOR UPDATE",
      [orderId, courierId]
    );
    const order = orderRes.rows[0];
    if (!order) throw new Error("Porudžbina nije pronađena");

    const next = nextOrderStatus(order.status);
    if (!next) throw new Error("Porudžbina je već završena");

    let updated: OrderRow;
    if (next === "ISPORUCENO") {
      const percent = await getActiveCommissionPercent();
      const provizija = Math.round(Number(order.cena) * (percent / 100) * 100) / 100;
      // Faza 9: zabeleži tačno vreme isporuke (isporuceno_at).
      const res = await client.query<OrderRow>(
        `UPDATE orders SET status = $1, provizija = $2, updated_at = now(),
           isporuceno_at = now()
         WHERE id = $3 RETURNING *`,
        [next, provizija, orderId]
      );
      updated = res.rows[0];
      await client.query(
        "UPDATE shipments SET status = 'ZAVRSENA' WHERE id = $1",
        [order.shipment_id]
      );
    } else {
      // Faza 9: jedini preostali među-korak je U_TRANZITU ("Preuzeo
      // ponudu") — NEXT_STATUS garantuje da je `next` ovde uvek
      // U_TRANZITU (jedina druga vrednost, ISPORUCENO, je pokrivena u
      // granu iznad, a null je već izbačen `if (!next) throw` gore), pa
      // se preuzeto_at bezuslovno postavlja. (Napomena: raniji pokušaj sa
      // `CASE WHEN $1 = 'U_TRANZITU' ...` je pucao sa "inconsistent types
      // deduced for parameter $1" jer Postgres ne može da izvede jedinstven
      // tip za $1 kad se koristi i kao vrednost enum kolone i u poređenju
      // sa string literalom u istom upitu.)
      const res = await client.query<OrderRow>(
        `UPDATE orders SET status = $1, updated_at = now(), preuzeto_at = now()
         WHERE id = $2 RETURNING *`,
        [next, orderId]
      );
      updated = res.rows[0];
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

/**
 * Cancels an order — either the client (owner of the shipment) or the
 * assigned courier may do this, as long as the order hasn't already
 * reached a final state. Exactly one of courierId/clientId should be
 * passed, matching whichever role is calling.
 */
export async function cancelOrder(
  orderId: string,
  actor: { courierId?: string; clientId?: string },
  razlog?: string
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const res = await client.query<OrderRow & { client_id: string }>(
      `SELECT o.*, s.client_id
       FROM orders o
       JOIN shipments s ON s.id = o.shipment_id
       WHERE o.id = $1
       FOR UPDATE`,
      [orderId]
    );
    const order = res.rows[0];
    if (!order) throw new Error("Porudžbina nije pronađena");

    const allowed =
      (actor.courierId && order.courier_id === actor.courierId) ||
      (actor.clientId && order.client_id === actor.clientId);
    if (!allowed) throw new Error("Nemate pravo da otkažete ovu porudžbinu");

    if (order.status === "ISPORUCENO" || order.status === "OTKAZANO") {
      throw new Error("Porudžbina se više ne može otkazati u ovom statusu");
    }

    await client.query(
      `UPDATE orders SET status = 'OTKAZANO', otkazano_razlog = $1, updated_at = now() WHERE id = $2`,
      [razlog ?? null, orderId]
    );
    await client.query("UPDATE shipments SET status = 'OTKAZANA' WHERE id = $1", [
      order.shipment_id,
    ]);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
