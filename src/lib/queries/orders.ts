import { pool, query, queryOne } from "../db";
import type { OrderRow, OrderStatus, ShipmentRow } from "../types";
import { getActiveCommissionPercent } from "./commission";

export interface OrderWithShipment extends OrderRow {
  zona_preuzimanja: ShipmentRow["zona_preuzimanja"];
  zona_isporuke: ShipmentRow["zona_isporuke"];
  adresa_preuzimanja: string;
  adresa_isporuke: string;
  tip: ShipmentRow["tip"];
  courier_naziv: string;
  courier_telefon: string;
  client_naziv?: string;
  client_kontakt_ime?: string;
  client_telefon?: string;
}

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  PREUZETO: "U_TRANZITU",
  U_TRANZITU: "NA_ISPORUCI",
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
    `SELECT o.*, s.zona_preuzimanja, s.zona_isporuke, s.adresa_preuzimanja,
            s.adresa_isporuke, s.tip, c.naziv AS courier_naziv, c.telefon AS courier_telefon
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
    `SELECT o.*, s.zona_preuzimanja, s.zona_isporuke, s.adresa_preuzimanja,
            s.adresa_isporuke, s.tip, c.naziv AS courier_naziv, c.telefon AS courier_telefon,
            u.ime AS client_kontakt_ime, u.telefon AS client_telefon
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

export async function listCompletedOrdersForCourier(
  courierId: string
): Promise<OrderWithShipment[]> {
  return query<OrderWithShipment>(
    `SELECT o.*, s.zona_preuzimanja, s.zona_isporuke, s.adresa_preuzimanja,
            s.adresa_isporuke, s.tip, c.naziv AS courier_naziv, c.telefon AS courier_telefon
     FROM orders o
     JOIN shipments s ON s.id = o.shipment_id
     JOIN couriers c ON c.id = o.courier_id
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
    `SELECT o.*, s.zona_preuzimanja, s.zona_isporuke, s.adresa_preuzimanja,
            s.adresa_isporuke, s.tip, c.naziv AS courier_naziv, c.telefon AS courier_telefon,
            comp.naziv AS client_naziv
     FROM orders o
     JOIN shipments s ON s.id = o.shipment_id
     JOIN couriers c ON c.id = o.courier_id
     JOIN companies comp ON comp.id = s.client_id
     ORDER BY o.created_at DESC`
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
): Promise<void> {
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

    if (next === "ISPORUCENO") {
      const percent = await getActiveCommissionPercent();
      const provizija = Math.round(Number(order.cena) * (percent / 100) * 100) / 100;
      await client.query(
        `UPDATE orders SET status = $1, provizija = $2, updated_at = now() WHERE id = $3`,
        [next, provizija, orderId]
      );
      await client.query(
        "UPDATE shipments SET status = 'ZAVRSENA' WHERE id = $1",
        [order.shipment_id]
      );
    } else {
      await client.query(
        "UPDATE orders SET status = $1, updated_at = now() WHERE id = $2",
        [next, orderId]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
