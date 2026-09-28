import { pool, query } from "../db";
import type { CourierMachineRow, MachineType } from "../types";

/**
 * Faza 19b: mašine koje dostavljač nudi za "Angažovanje mašina" (uvek sa
 * rukovaocem), sa opcionom indikativnom cenom po satu/danu. Isti obrazac
 * kao courier_zones/updateCourierPricing — replace-all na svaku izmenu
 * (jednostavnije i bezbednije od pojedinačnog add/remove za mali broj
 * stavki po dostavljaču).
 */
export async function getCourierMachines(
  courierId: string
): Promise<CourierMachineRow[]> {
  return query<CourierMachineRow>(
    "SELECT * FROM courier_machines WHERE courier_id = $1 ORDER BY tip_masine",
    [courierId]
  );
}

/** Batch verzija za liste (npr. operaterski pregled svih dostavljača). */
export async function getMachinesForCouriers(
  courierIds: string[]
): Promise<Map<string, CourierMachineRow[]>> {
  const map = new Map<string, CourierMachineRow[]>();
  if (courierIds.length === 0) return map;
  const rows = await query<CourierMachineRow>(
    "SELECT * FROM courier_machines WHERE courier_id = ANY($1::uuid[]) ORDER BY tip_masine",
    [courierIds]
  );
  for (const row of rows) {
    const existing = map.get(row.courier_id);
    if (existing) existing.push(row);
    else map.set(row.courier_id, [row]);
  }
  return map;
}

export async function setCourierMachines(
  courierId: string,
  items: { tipMasine: MachineType; cenaPoSatu: number | null; cenaPoDanu: number | null }[]
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM courier_machines WHERE courier_id = $1", [
      courierId,
    ]);
    for (const item of items) {
      await client.query(
        `INSERT INTO courier_machines (courier_id, tip_masine, cena_po_satu, cena_po_danu)
         VALUES ($1, $2, $3, $4)`,
        [courierId, item.tipMasine, item.cenaPoSatu, item.cenaPoDanu]
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
