"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../auth";
import { getShipmentById } from "../queries/shipments";
import { acceptOffer, createManualOffer } from "../queries/offers";
import type { ActionState } from "./auth-actions";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function acceptOfferAction(
  shipmentId: string,
  offerId: string
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT" || !user.companyId) {
    return { error: "Morate biti prijavljeni kao klijent." };
  }

  const shipment = await getShipmentById(shipmentId);
  if (!shipment || shipment.client_id !== user.companyId) {
    return { error: "Pošiljka nije pronađena." };
  }

  try {
    await acceptOffer(shipmentId, offerId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Greška." };
  }

  revalidatePath(`/klijent/posiljke/${shipmentId}`);
  return {};
}

export async function sendManualOfferAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "COURIER" || !user.courierId) {
    return { error: "Morate biti prijavljeni kao dostavljač." };
  }

  const shipmentId = str(formData, "shipmentId");
  const cena = Number(str(formData, "cena"));
  const procenjenoVremeMin = Number(str(formData, "procenjenoVremeMin"));
  const napomena = str(formData, "napomena");

  if (!shipmentId || !Number.isFinite(cena) || cena <= 0) {
    return { error: "Unesite validnu cenu." };
  }
  if (!Number.isFinite(procenjenoVremeMin) || procenjenoVremeMin <= 0) {
    return { error: "Unesite procenjeno vreme dolaska (u minutima)." };
  }

  const shipment = await getShipmentById(shipmentId);
  if (!shipment || shipment.status !== "OTVORENA" || !shipment.nestandardna) {
    return { error: "Ovaj zahtev više nije aktivan." };
  }

  await createManualOffer({
    shipmentId,
    courierId: user.courierId,
    cena,
    procenjenoVremeMin,
    napomena: napomena || undefined,
  });

  revalidatePath("/dostavljac/zahtevi");
  return { success: true };
}
