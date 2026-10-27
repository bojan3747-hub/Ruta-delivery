"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../auth";
import { getOrderById } from "../queries/orders";
import { getShipmentById, getShipmentByGuestToken } from "../queries/shipments";
import { createRating } from "../queries/ratings";
import { isTooLong, MAX_TEXT_LEN } from "../validation";
import type { RatingDirection } from "../types";
import type { ActionState } from "./auth-actions";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function submitRatingAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "CLIENT" && user.role !== "COURIER")) {
    return { error: "Morate biti prijavljeni kao klijent ili dostavljač." };
  }

  const orderId = str(formData, "orderId");
  const ocena = Number(str(formData, "ocena"));
  const komentar = str(formData, "komentar");

  if (!Number.isInteger(ocena) || ocena < 1 || ocena > 5) {
    return { error: "Ocena mora biti od 1 do 5." };
  }
  if (isTooLong(komentar, MAX_TEXT_LEN)) {
    return { error: "Komentar je predugačak." };
  }

  const order = await getOrderById(orderId);
  if (!order) return { error: "Porudžbina nije pronađena." };

  let smer: RatingDirection;
  let revalidatePathTarget: string;

  if (user.role === "CLIENT") {
    if (!user.companyId) return { error: "Morate biti prijavljeni kao klijent." };
    const shipment = await getShipmentById(order.shipment_id);
    if (!shipment || shipment.client_id !== user.companyId) {
      return { error: "Porudžbina nije pronađena." };
    }
    smer = "KLIJENT_KA_DOSTAVLJACU";
    revalidatePathTarget = `/klijent/posiljke/${shipment.id}`;
  } else {
    if (!user.courierId || order.courier_id !== user.courierId) {
      return { error: "Porudžbina nije pronađena." };
    }
    smer = "DOSTAVLJAC_KA_KLIJENTU";
    revalidatePathTarget = "/dostavljac/aktivne";
  }

  try {
    await createRating({ orderId, smer, ocena, komentar: komentar || undefined });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Greška." };
  }

  revalidatePath(revalidatePathTarget);
  return {};
}

/** Faza 24: gost ocenjuje dostavljača preko gost_token-a — isti pravac
 * ocene (KLIJENT_KA_DOSTAVLJACU) kao i ulogovani klijent, reuse iste
 * queries/ratings.createRating funkcije; gostovo pravo se utvrđuje preko
 * poklapanja tokena umesto sesije/companyId. */
export async function submitRatingGuestAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const orderId = str(formData, "orderId");
  const gostToken = str(formData, "gostToken");
  const ocena = Number(str(formData, "ocena"));
  const komentar = str(formData, "komentar");

  if (!Number.isInteger(ocena) || ocena < 1 || ocena > 5) {
    return { error: "Ocena mora biti od 1 do 5." };
  }
  if (isTooLong(komentar, MAX_TEXT_LEN)) {
    return { error: "Komentar je predugačak." };
  }

  const order = await getOrderById(orderId);
  if (!order) return { error: "Porudžbina nije pronađena." };

  const shipment = await getShipmentByGuestToken(gostToken);
  if (!shipment || shipment.id !== order.shipment_id) {
    return { error: "Porudžbina nije pronađena." };
  }

  try {
    await createRating({
      orderId,
      smer: "KLIJENT_KA_DOSTAVLJACU",
      ocena,
      komentar: komentar || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Greška." };
  }

  revalidatePath(`/pracenje/${gostToken}`);
  return {};
}
