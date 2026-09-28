"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../auth";
import { acceptMachineOffer, getMachineRequestById } from "../queries/machine-requests";
import { createManualMachineOffer } from "../queries/machine-offers";
import { isTooLong, MAX_TEXT_LEN } from "../validation";
import type { ActionState } from "./auth-actions";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function acceptMachineOfferAction(
  requestId: string,
  offerId: string
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT" || !user.companyId) {
    return { error: "Morate biti prijavljeni kao klijent." };
  }

  const request = await getMachineRequestById(requestId);
  if (!request || request.client_id !== user.companyId) {
    return { error: "Zahtev nije pronađen." };
  }

  try {
    await acceptMachineOffer(requestId, offerId, user.companyId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Greška." };
  }

  revalidatePath(`/klijent/masine/${requestId}`);
  revalidatePath("/klijent/masine");
  return {};
}

export async function sendMachineOfferAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "COURIER" || !user.courierId) {
    return { error: "Morate biti prijavljeni kao dostavljač." };
  }

  const machineRequestId = str(formData, "machineRequestId");
  const cena = Number(str(formData, "cena"));
  const procenaTrajanja = str(formData, "procenaTrajanja");
  const napomena = str(formData, "napomena");

  if (!machineRequestId || !Number.isFinite(cena) || cena <= 0) {
    return { error: "Unesite validnu cenu." };
  }
  if (!procenaTrajanja) {
    return { error: "Unesite procenu trajanja posla." };
  }
  if (isTooLong(procenaTrajanja, MAX_TEXT_LEN) || isTooLong(napomena, MAX_TEXT_LEN)) {
    return { error: "Neko od polja je predugačko." };
  }

  const request = await getMachineRequestById(machineRequestId);
  if (!request || request.status !== "OTVOREN") {
    return { error: "Ovaj zahtev više nije aktivan." };
  }

  await createManualMachineOffer({
    machineRequestId,
    courierId: user.courierId,
    cena,
    procenaTrajanja,
    napomena: napomena || undefined,
  });

  // Isto kao kod sendManualOfferAction za pošiljke: namerno bez
  // revalidatePath ovde — provajder prvo treba da vidi potvrdu na OVOM
  // renderu, sledeći AutoRefresh/navigacija će prirodno ukloniti zahtev.
  return { success: true };
}
