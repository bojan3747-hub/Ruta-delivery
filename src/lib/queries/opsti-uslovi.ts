import { pool, query, queryOne } from "../db";
import type { OpstiUsloviMeta } from "../types";

export async function getCurrentOpstiUsloviMeta(): Promise<OpstiUsloviMeta | null> {
  return queryOne<OpstiUsloviMeta>(
    `SELECT id, naziv_fajla, created_at FROM opsti_uslovi_dokumenti
     ORDER BY created_at DESC LIMIT 1`
  );
}

export async function getCurrentOpstiUsloviFile(): Promise<{
  naziv_fajla: string;
  sadrzaj: Buffer;
} | null> {
  return queryOne<{ naziv_fajla: string; sadrzaj: Buffer }>(
    `SELECT naziv_fajla, sadrzaj FROM opsti_uslovi_dokumenti
     ORDER BY created_at DESC LIMIT 1`
  );
}

export async function listOpstiUsloviHistory(): Promise<OpstiUsloviMeta[]> {
  return query<OpstiUsloviMeta>(
    `SELECT id, naziv_fajla, created_at FROM opsti_uslovi_dokumenti
     ORDER BY created_at DESC`
  );
}

export async function uploadOpstiUslovi(
  nazivFajla: string,
  sadrzaj: Buffer
): Promise<void> {
  await pool.query(
    `INSERT INTO opsti_uslovi_dokumenti (naziv_fajla, sadrzaj) VALUES ($1, $2)`,
    [nazivFajla, sadrzaj]
  );
}
