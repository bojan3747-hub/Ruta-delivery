import { pool, query, queryOne } from "../db";
import type { OrderRow, RatingRow } from "../types";

export async function getRatingForOrder(
  orderId: string
): Promise<RatingRow | null> {
  return queryOne<RatingRow>("SELECT * FROM ratings WHERE order_id = $1", [
    orderId,
  ]);
}

export interface RatingWithZones extends RatingRow {
  zona_preuzimanja: string;
  zona_isporuke: string;
}

export async function listRatingsForCourier(
  courierId: string
): Promise<RatingWithZones[]> {
  return query<RatingWithZones>(
    `SELECT r.*, s.zona_preuzimanja, s.zona_isporuke
     FROM ratings r
     JOIN orders o ON o.id = r.order_id
     JOIN shipments s ON s.id = o.shipment_id
     WHERE o.courier_id = $1
     ORDER BY r.created_at DESC`,
    [courierId]
  );
}

export async function createRating(input: {
  orderId: string;
  ocena: number;
  komentar?: string;
}): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const orderRes = await client.query<OrderRow>(
      "SELECT * FROM orders WHERE id = $1 FOR UPDATE",
      [input.orderId]
    );
    const order = orderRes.rows[0];
    if (!order) throw new Error("Porudžbina nije pronađena");
    if (order.status !== "ISPORUCENO") {
      throw new Error("Ocena je moguća tek nakon isporuke");
    }

    await client.query(
      `INSERT INTO ratings (order_id, ocena, komentar)
       VALUES ($1, $2, $3)
       ON CONFLICT (order_id) DO NOTHING`,
      [input.orderId, input.ocena, input.komentar ?? null]
    );

    const courierRes = await client.query<{
      ocena_prosek: string | null;
      broj_ocena: number;
    }>("SELECT ocena_prosek, broj_ocena FROM couriers WHERE id = $1 FOR UPDATE", [
      order.courier_id,
    ]);
    const current = courierRes.rows[0];
    const oldAvg = current?.ocena_prosek ? Number(current.ocena_prosek) : 0;
    const oldCount = current?.broj_ocena ?? 0;
    const newCount = oldCount + 1;
    const newAvg = (oldAvg * oldCount + input.ocena) / newCount;

    await client.query(
      "UPDATE couriers SET ocena_prosek = $1, broj_ocena = $2 WHERE id = $3",
      [Math.round(newAvg * 100) / 100, newCount, order.courier_id]
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
