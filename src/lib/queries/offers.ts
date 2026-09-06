import { pool, query, queryOne } from "../db";
import { computeAutoQuote } from "../pricing";
import { findEligibleActiveCouriers } from "./couriers";
import { updateShipmentStatus } from "./shipments";
import type { OfferRow, ShipmentRow } from "../types";

export interface OfferWithCourier extends OfferRow {
  courier_naziv: string;
  courier_tip_vozila: string | null;
  courier_ocena_prosek: string | null;
  courier_verifikovan: boolean;
}

/**
 * Runs the automatic-quote flow for a newly created standard shipment
 * (KAN-5): finds active couriers covering both zones with free capacity,
 * prices each one from their saved price list, and stores an offer per
 * courier.
 */
export async function createAutoOffers(
  shipment: ShipmentRow
): Promise<number> {
  const couriers = await findEligibleActiveCouriers(
    shipment.zona_preuzimanja,
    shipment.zona_isporuke
  );

  let created = 0;
  for (const courier of couriers) {
    const quote = computeAutoQuote(courier, shipment);
    if (!quote) continue;
    await query(
      `INSERT INTO offers (shipment_id, courier_id, cena, procenjeno_vreme_min, tip, status)
       VALUES ($1, $2, $3, $4, 'AUTOMATSKA', 'POSLATA')
       ON CONFLICT (shipment_id, courier_id) DO NOTHING`,
      [shipment.id, courier.id, quote.cenaEur, quote.procenjenoVremeMin]
    );
    created += 1;
  }

  if (created > 0) {
    await updateShipmentStatus(shipment.id, "PONUDE_STIGLE");
  }
  return created;
}

export async function createManualOffer(input: {
  shipmentId: string;
  courierId: string;
  cena: number;
  procenjenoVremeMin: number;
  napomena?: string;
}): Promise<OfferRow> {
  const row = await queryOne<OfferRow>(
    `INSERT INTO offers (shipment_id, courier_id, cena, procenjeno_vreme_min, napomena, tip, status)
     VALUES ($1, $2, $3, $4, $5, 'RUCNA', 'POSLATA')
     ON CONFLICT (shipment_id, courier_id)
     DO UPDATE SET cena = EXCLUDED.cena, procenjeno_vreme_min = EXCLUDED.procenjeno_vreme_min,
                    napomena = EXCLUDED.napomena, status = 'POSLATA'
     RETURNING *`,
    [input.shipmentId, input.courierId, input.cena, input.procenjenoVremeMin, input.napomena ?? null]
  );
  if (!row) throw new Error("Slanje ponude nije uspelo");

  await updateShipmentStatus(input.shipmentId, "PONUDE_STIGLE");
  return row;
}

export async function listOffersForShipment(
  shipmentId: string
): Promise<OfferWithCourier[]> {
  return query<OfferWithCourier>(
    `SELECT o.*, c.naziv AS courier_naziv, c.tip_vozila AS courier_tip_vozila,
            c.ocena_prosek AS courier_ocena_prosek, c.verifikovan AS courier_verifikovan
     FROM offers o
     JOIN couriers c ON c.id = o.courier_id
     WHERE o.shipment_id = $1 AND o.status = 'POSLATA'
     ORDER BY o.cena ASC`,
    [shipmentId]
  );
}

export async function getOfferForCourier(
  shipmentId: string,
  courierId: string
): Promise<OfferRow | null> {
  return queryOne<OfferRow>(
    "SELECT * FROM offers WHERE shipment_id = $1 AND courier_id = $2",
    [shipmentId, courierId]
  );
}

/**
 * Client accepts one offer (KAN-6): creates the order, marks the shipment
 * as chosen, and rejects the other pending offers for that shipment.
 */
export async function acceptOffer(
  shipmentId: string,
  offerId: string
): Promise<string> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const shipmentRes = await client.query<ShipmentRow>(
      "SELECT * FROM shipments WHERE id = $1 FOR UPDATE",
      [shipmentId]
    );
    const shipment = shipmentRes.rows[0];
    if (!shipment) throw new Error("Pošiljka nije pronađena");
    if (shipment.status === "IZABRANA" || shipment.status === "ZAVRSENA") {
      throw new Error("Za ovu pošiljku je ponuda već izabrana");
    }

    const offerRes = await client.query<OfferRow>(
      "SELECT * FROM offers WHERE id = $1 AND shipment_id = $2 FOR UPDATE",
      [offerId, shipmentId]
    );
    const offer = offerRes.rows[0];
    if (!offer) throw new Error("Ponuda nije pronađena");
    if (offer.status !== "POSLATA") {
      throw new Error("Ova ponuda više nije aktivna");
    }

    const orderRes = await client.query<{ id: string }>(
      `INSERT INTO orders (shipment_id, offer_id, courier_id, cena, status)
       VALUES ($1, $2, $3, $4, 'PREUZETO')
       RETURNING id`,
      [shipmentId, offerId, offer.courier_id, offer.cena]
    );

    await client.query("UPDATE offers SET status = 'PRIHVACENA' WHERE id = $1", [
      offerId,
    ]);
    await client.query(
      `UPDATE offers SET status = 'ODBIJENA'
       WHERE shipment_id = $1 AND id <> $2 AND status = 'POSLATA'`,
      [shipmentId, offerId]
    );
    await client.query("UPDATE shipments SET status = 'IZABRANA' WHERE id = $1", [
      shipmentId,
    ]);

    await client.query("COMMIT");
    return orderRes.rows[0].id;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
