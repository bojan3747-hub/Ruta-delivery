import { pool, queryOne } from "../db";
import type { CommissionSettingRow, CourierRow } from "../types";

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

// Faza 12: automatski besplatan period za nove dostavljače, računat od
// datuma AKTIVACIJE naloga (ne od datuma prijave/leada — dostavljač pre
// aktivacije ionako ne može ništa da zaradi, pa nema smisla da mu tad
// "curi" besplatan period).
export const FREE_PERIOD_MONTHS = 3;

/** Datum do kog dostavljač ima automatski besplatan period, ili null ako
 * nalog još nije aktiviran. */
export function getFreeUntil(aktiviranAt: string | Date | null): Date | null {
  if (!aktiviranAt) return null;
  const until = new Date(aktiviranAt);
  until.setMonth(until.getMonth() + FREE_PERIOD_MONTHS);
  return until;
}

export function isInFreePeriod(aktiviranAt: string | Date | null): boolean {
  const until = getFreeUntil(aktiviranAt);
  return until !== null && Date.now() < until.getTime();
}

export type CommissionSource = "RUCNO" | "BESPLATAN_PERIOD" | "GLOBALNO";

export interface EffectiveCommission {
  percent: number;
  source: CommissionSource;
  /** Popunjeno samo kad je source BESPLATAN_PERIOD (ili bi moglo biti, radi prikaza). */
  freeUntil: Date | null;
}

/**
 * Efektivan procenat provizije za konkretnog dostavljača, u ovom redosledu:
 * 1. Ručno podešen lični procenat (couriers.provizija_procenat) — ako
 *    postoji, UVEK ima prednost, bez obzira na sve ostalo (operater time
 *    može i da produži besplatan period preko 3 meseca, i da ga skrati).
 * 2. Automatski besplatan period od 3 meseca od aktivacije naloga.
 * 3. Globalni procenat iz commission_settings.
 */
export async function getEffectiveCommissionPercent(
  courier: Pick<CourierRow, "provizija_procenat" | "aktiviran_at">
): Promise<EffectiveCommission> {
  const freeUntil = getFreeUntil(courier.aktiviran_at);

  if (courier.provizija_procenat !== null && courier.provizija_procenat !== undefined) {
    return { percent: Number(courier.provizija_procenat), source: "RUCNO", freeUntil };
  }
  if (freeUntil !== null && Date.now() < freeUntil.getTime()) {
    return { percent: 0, source: "BESPLATAN_PERIOD", freeUntil };
  }
  const global = await getActiveCommissionPercent();
  return { percent: global, source: "GLOBALNO", freeUntil };
}
