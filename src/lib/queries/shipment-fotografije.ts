import { query, queryOne } from "../db";

export async function uploadShipmentFotografija(
  shipmentId: string,
  sadrzaj: Buffer,
  contentType: string
): Promise<void> {
  await query(
    `INSERT INTO shipment_fotografije (shipment_id, sadrzaj, content_type)
     VALUES ($1, $2, $3)
     ON CONFLICT (shipment_id)
     DO UPDATE SET sadrzaj = $2, content_type = $3, created_at = now()`,
    [shipmentId, sadrzaj, contentType]
  );
}

export async function hasShipmentFotografija(
  shipmentId: string
): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    "SELECT id FROM shipment_fotografije WHERE shipment_id = $1",
    [shipmentId]
  );
  return row !== null;
}

export async function getShipmentFotografijaFile(
  shipmentId: string
): Promise<{ sadrzaj: Buffer; content_type: string } | null> {
  return queryOne<{ sadrzaj: Buffer; content_type: string }>(
    "SELECT sadrzaj, content_type FROM shipment_fotografije WHERE shipment_id = $1",
    [shipmentId]
  );
}
