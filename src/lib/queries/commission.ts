import { pool, queryOne } from "../db";
import type { CommissionSettingRow } from "../types";

export async function getCommissionSetting(): Promise<CommissionSettingRow> {
  const row = await queryOne<CommissionSettingRow>(
    "SELECT * FROM commission_settings WHERE id = 1"
  );
  if (!row) throw new Error("Podešavanje provizije nije pronađeno");
  return row;
}

export async function getActiveCommissionPercent(): Promise<number> {
  const setting = await getCommissionSetting();
  return Number(setting.procenat);
}

export async function setCommissionPercent(percent: number): Promise<void> {
  await pool.query(
    `UPDATE commission_settings SET procenat = $1, updated_at = now() WHERE id = 1`,
    [percent]
  );
}
