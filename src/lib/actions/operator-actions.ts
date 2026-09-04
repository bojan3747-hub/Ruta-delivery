"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../auth";
import { createPreApprovedCourier } from "../queries/couriers";
import { setCommissionPercent } from "../queries/commission";
import type { ActionState } from "./auth-actions";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

async function requireOperator() {
  const user = await getCurrentUser();
  if (!user || user.role !== "OPERATOR") {
    throw new Error("Morate biti prijavljeni kao operater.");
  }
  return user;
}

export async function createPreApprovedCourierAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireOperator();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Greška." };
  }

  const naziv = str(formData, "naziv");
  const telefon = str(formData, "telefon");
  const izvorKontakta = str(formData, "izvorKontakta");

  if (!naziv || !telefon || !izvorKontakta) {
    return { error: "Popunite sva obavezna polja." };
  }

  await createPreApprovedCourier({ naziv, telefon, izvorKontakta });

  revalidatePath("/operater/dostavljaci");
  return { success: true };
}

export async function setCommissionAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireOperator();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Greška." };
  }

  const procenat = Number(str(formData, "procenat"));
  if (!Number.isFinite(procenat) || procenat < 0 || procenat > 100) {
    return { error: "Procenat provizije mora biti između 0 i 100." };
  }

  await setCommissionPercent(procenat);
  revalidatePath("/operater/provizija");
  return { success: true };
}
