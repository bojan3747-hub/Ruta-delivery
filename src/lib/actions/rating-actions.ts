"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../auth";
import { getOrderById } from "../queries/orders";
import { getShipmentById } from "../queries/shipments";
import { createRating } from "../queries/ratings";
import type { ActionState } from "./auth-actions";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function submitRatingAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT" || !user.companyId) {
    return { error: "Morate biti prijavljeni kao klijent." };
  }

  const orderId = str(formData, "orderId");
  const ocena = Number(str(formData, "ocena"));
  const komentar = str(formData, "komentar");

  if (!Number.isInteger(ocena) || ocena < 1 || ocena > 5) {
    return { error: "Ocena mora biti od 1 do 5." };
  }

  const order = await getOrderById(orderId);
  if (!order) return { error: "Porudžbina nije pronađena." };
  const shipment = await getShipmentById(order.shipment_id);
  if (!shipment || shipment.client_id !== user.companyId) {
    return { error: "Porudžbina nije pronađena." };
  }

  try {
    await createRating({ orderId, ocena, komentar: komentar || undefined });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Greška." };
  }

  revalidatePath(`/klijent/posiljke/${shipment.id}`);
  return {};
}
