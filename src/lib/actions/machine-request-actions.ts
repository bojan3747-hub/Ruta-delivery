"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../auth";
import {
  advanceMachineRequest,
  cancelMachineRequest,
  createMachineRequest,
} from "../queries/machine-requests";
import type { MachineType, Zone } from "../types";
import { MACHINE_TYPE_LABELS } from "../labels";
import { ZONE_LABELS } from "../zones";
import { isValidPhone, isTooLong, MAX_NAME_LEN, MAX_TEXT_LEN } from "../validation";
import type { ActionState } from "./auth-actions";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function createMachineRequestAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT" || !user.companyId) {
    return { error: "Morate biti prijavljeni kao klijent." };
  }

  const zona = str(formData, "zona") as Zone;
  const adresa = str(formData, "adresa");
  const tipMasine = str(formData, "tipMasine") as MachineType;
  const opisPosla = str(formData, "opisPosla");
  const zeljeniTermin = str(formData, "zeljeniTermin");
  const kontaktIme = str(formData, "kontaktIme");
  const kontaktTelefon = str(formData, "kontaktTelefon");
  const napomena = str(formData, "napomena");

  if (!zona || !adresa || !tipMasine || !opisPosla || !kontaktIme || !kontaktTelefon) {
    return { error: "Popunite sva obavezna polja." };
  }
  if (!(zona in ZONE_LABELS)) {
    return { error: "Izaberite validnu zonu." };
  }
  if (!(tipMasine in MACHINE_TYPE_LABELS)) {
    return { error: "Izaberite validan tip mašine." };
  }
  if (!isValidPhone(kontaktTelefon)) {
    return { error: "Unesite ispravan broj telefona." };
  }
  if (
    isTooLong(kontaktIme, MAX_NAME_LEN) ||
    isTooLong(adresa, MAX_TEXT_LEN) ||
    isTooLong(opisPosla, MAX_TEXT_LEN) ||
    isTooLong(zeljeniTermin, MAX_NAME_LEN) ||
    isTooLong(napomena, MAX_TEXT_LEN)
  ) {
    return { error: "Neko od polja je predugačko." };
  }

  const request = await createMachineRequest({
    clientId: user.companyId,
    zona,
    adresa,
    tipMasine,
    opisPosla,
    zeljeniTermin: zeljeniTermin || undefined,
    kontaktIme,
    kontaktTelefon,
    napomena: napomena || undefined,
  });

  revalidatePath("/klijent/masine");
  redirect(`/klijent/masine?novo=${request.id}`);
}

/**
 * Faza 19d: sad je pozivaju i klijent (dok je zahtev OTVOREN, ili posle
 * prihvatanja) i provajder (posle prihvatanja) — isti obrazac kao
 * cancelOrderAction, koji actor se prosleđuje zavisi od uloge.
 */
export async function cancelMachineRequestAction(
  requestId: string,
  razlog?: string
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "CLIENT" && user.role !== "COURIER")) {
    return { error: "Morate biti prijavljeni." };
  }

  try {
    await cancelMachineRequest(
      requestId,
      { clientId: user.companyId ?? undefined, courierId: user.courierId ?? undefined },
      razlog
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Greška." };
  }

  revalidatePath("/klijent/masine");
  revalidatePath("/dostavljac/masine/aktivna");
  return {};
}

export async function advanceMachineRequestAction(
  requestId: string
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "COURIER" || !user.courierId) {
    return { error: "Morate biti prijavljeni kao dostavljač." };
  }

  try {
    await advanceMachineRequest(requestId, user.courierId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Greška." };
  }

  revalidatePath("/dostavljac/masine/aktivna");
  revalidatePath("/klijent/masine");
  return {};
}
