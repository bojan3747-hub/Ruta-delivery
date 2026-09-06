import { PoolClient } from "pg";
import { pool, query, queryOne } from "../db";
import type { OrderRow, RatingDirection, RatingRow } from "../types";

export async function getRatingForOrder(
  orderId: string,
  smer: RatingDirection
): Promise<RatingRow | null> {
  return queryOne<RatingRow>(
    "SELECT * FROM ratings WHERE order_id = $1 AND smer = $2",
    [orderId, smer]
  );
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
     WHERE o.courier_id = $1 AND r.smer = 'KLIJENT_KA_DOSTAVLJACU'
     ORDER BY r.created_at DESC`,
    [courierId]
  );
}

export async function listRatingsForCompany(
  companyId: string
): Promise<RatingWithZones[]> {
  return query<RatingWithZones>(
    `SELECT r.*, s.zona_preuzimanja, s.zona_isporuke
     FROM ratings r
     JOIN orders o ON o.id = r.order_id
     JOIN shipments s ON s.id = o.shipment_id
     WHERE s.client_id = $1 AND r.smer = 'DOSTAVLJAC_KA_KLIJENTU'
     ORDER BY r.created_at DESC`,
    [companyId]
  );
}

async function bumpCourierRating(
  client: PoolClient,
  courierId: string,
  ocena: number
): Promise<void> {
  const res = await client.query<{
    ocena_prosek: string | null;
    broj_ocena: number;
  }>("SELECT ocena_prosek, broj_ocena FROM couriers WHERE id = $1 FOR UPDATE", [
    courierId,
  ]);
  const current = res.rows[0];
  const oldAvg = current?.ocena_prosek ? Number(current.ocena_prosek) : 0;
  const oldCount = current?.broj_ocena ?? 0;
  const newCount = oldCount + 1;
  const newAvg = (oldAvg * oldCount + ocena) / newCount;
  await client.query(
    "UPDATE couriers SET ocena_prosek = $1, broj_ocena = $2 WHERE id = $3",
    [Math.round(newAvg * 100) / 100, newCount, courierId]
  );
}

async function bumpCompanyRating(
  client: PoolClient,
  companyId: string,
  ocena: number
): Promise<void> {
  const res = await client.query<{
    ocena_prosek: string | null;
    broj_ocena: number;
  }>("SELECT ocena_prosek, broj_ocena FROM companies WHERE id = $1 FOR UPDATE", [
    companyId,
  ]);
  const current = res.rows[0];
  const oldAvg = current?.ocena_prosek ? Number(current.ocena_prosek) : 0;
  const oldCount = current?.broj_ocena ?? 0;
  const newCount = oldCount + 1;
  const newAvg = (oldAvg * oldCount + ocena) / newCount;
  await client.query(
    "UPDATE companies SET ocena_prosek = $1, broj_ocena = $2 WHERE id = $3",
    [Math.round(newAvg * 100) / 100, newCount, companyId]
  );
}

export async function createRating(input: {
  orderId: string;
  smer: RatingDirection;
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
      `INSERT INTO ratings (order_id, smer, ocena, komentar)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (order_id, smer) DO NOTHING`,
      [input.orderId, input.smer, input.ocena, input.komentar ?? null]
    );

    if (input.smer === "KLIJENT_KA_DOSTAVLJACU") {
      await bumpCourierRating(client, order.courier_id, input.ocena);
    } else {
      const shipmentRes = await client.query<{ client_id: string }>(
        "SELECT client_id FROM shipments WHERE id = $1",
        [order.shipment_id]
      );
      const clientId = shipmentRes.rows[0]?.client_id;
      if (!clientId) throw new Error("Klijent nije pronađen");
      await bumpCompanyRating(client, clientId, input.ocena);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
