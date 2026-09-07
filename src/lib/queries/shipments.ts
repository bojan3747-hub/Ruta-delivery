import { pool, query, queryOne } from "../db";
import type {
  ShipmentRow,
  ShipmentStatus,
  ShipmentType,
  TerminType,
  Zone,
} from "../types";

export async function createShipment(input: {
  clientId: string;
  zonaPreuzimanja: Zone;
  zonaIsporuke: Zone;
  adresaPreuzimanja: string;
  adresaIsporuke: string;
  posiljalacIme?: string;
  posiljalacTelefon?: string;
  primalacIme?: string;
  primalacTelefon?: string;
  tip: ShipmentType;
  hitno: boolean;
  nestandardna: boolean;
  zeljeniTermin: TerminType;
  terminDetalji?: string;
  napomena?: string;
  deklarisanaVrednost: number;
}): Promise<ShipmentRow> {
  const row = await queryOne<ShipmentRow>(
    `INSERT INTO shipments (
       client_id, zona_preuzimanja, zona_isporuke, adresa_preuzimanja,
       adresa_isporuke, posiljalac_ime, posiljalac_telefon, primalac_ime,
       primalac_telefon, tip, hitno, nestandardna, zeljeni_termin,
       termin_detalji, napomena, deklarisana_vrednost
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING *`,
    [
      input.clientId,
      input.zonaPreuzimanja,
      input.zonaIsporuke,
      input.adresaPreuzimanja,
      input.adresaIsporuke,
      input.posiljalacIme ?? null,
      input.posiljalacTelefon ?? null,
      input.primalacIme ?? null,
      input.primalacTelefon ?? null,
      input.tip,
      input.hitno,
      input.nestandardna,
      input.zeljeniTermin,
      input.terminDetalji ?? null,
      input.napomena ?? null,
      input.deklarisanaVrednost,
    ]
  );
  if (!row) throw new Error("Kreiranje pošiljke nije uspelo");
  return row;
}

export async function getShipmentById(
  id: string
): Promise<ShipmentRow | null> {
  return queryOne<ShipmentRow>("SELECT * FROM shipments WHERE id = $1", [id]);
}

export async function listShipmentsByClient(
  clientId: string
): Promise<ShipmentRow[]> {
  return query<ShipmentRow>(
    "SELECT * FROM shipments WHERE client_id = $1 ORDER BY created_at DESC",
    [clientId]
  );
}

export async function updateShipmentStatus(
  id: string,
  status: ShipmentStatus
): Promise<void> {
  await query("UPDATE shipments SET status = $1 WHERE id = $2", [status, id]);
}

/**
 * Client cancels their own shipment — only allowed before a courier has
 * been chosen (no order exists yet). Once an order exists, cancelOrder
 * (in queries/orders.ts) is the right call instead.
 */
export async function cancelShipment(
  shipmentId: string,
  clientId: string
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const res = await client.query<ShipmentRow>(
      "SELECT * FROM shipments WHERE id = $1 FOR UPDATE",
      [shipmentId]
    );
    const shipment = res.rows[0];
    if (!shipment) throw new Error("Pošiljka nije pronađena");
    if (shipment.client_id !== clientId) {
      throw new Error("Nemate pravo da otkažete ovu pošiljku");
    }
    if (shipment.status !== "OTVORENA" && shipment.status !== "PONUDE_STIGLE") {
      throw new Error("Pošiljka se više ne može otkazati u ovom statusu");
    }

    await client.query("UPDATE shipments SET status = 'OTKAZANA' WHERE id = $1", [
      shipmentId,
    ]);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export const MANUAL_REQUEST_WINDOW_MINUTES = 15;

/**
 * Open shipments a courier can still send an offer for (Faza 4): every
 * standard shipment stays visible until someone offers (no deadline —
 * we don't want a shipment to silently become unreachable), while
 * non-standard shipments keep the original 15-minute response window
 * (KAN-9). Either way: must cover both zones, the courier hasn't already
 * responded, and the shipment hasn't already been assigned.
 */
export async function listOpenRequestsForCourier(
  courierId: string
): Promise<ShipmentRow[]> {
  return query<ShipmentRow>(
    `SELECT s.* FROM shipments s
     WHERE s.status = 'OTVORENA'
       AND (
         s.nestandardna = false
         OR s.created_at > now() - interval '${MANUAL_REQUEST_WINDOW_MINUTES} minutes'
       )
       AND EXISTS (SELECT 1 FROM courier_zones cz WHERE cz.courier_id = $1 AND cz.zone = s.zona_preuzimanja)
       AND EXISTS (SELECT 1 FROM courier_zones cz WHERE cz.courier_id = $1 AND cz.zone = s.zona_isporuke)
       AND NOT EXISTS (
         SELECT 1 FROM offers o WHERE o.shipment_id = s.id AND o.courier_id = $1
       )
     ORDER BY s.created_at ASC`,
    [courierId]
  );
}
