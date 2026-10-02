"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../auth";
import { getShipmentById, getClientUserIdForShipment } from "../queries/shipments";
import { acceptOffer, createManualOffer } from "../queries/offers";
import { isTooLong, MAX_TEXT_LEN } from "../validation";
import { sendPushToUser } from "../push";
import { formatMoney } from "../labels";
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
  if (isTooLong(napomena, MAX_TEXT_LEN)) {
    return { error: "Napomena je predugačka." };
  }

  const shipment = await getShipmentById(shipmentId);
  if (!shipment || shipment.status !== "OTVORENA") {
    return { error: "Ovaj zahtev više nije aktivan." };
  }

  await createManualOffer({
    shipmentId,
    courierId: user.courierId,
    cena,
    procenjenoVremeMin,
    napomena: napomena || undefined,
  });

  // Faza 21: push klijentu da je stigla ponuda — najvremenski osetljiviji
  // trenutak u celom toku (do sad je klijent morao sam da proverava
  // aplikaciju). Greška u slanju push-a nikad ne sme da pokvari uspešno
  // poslatu ponudu, zato je van try/catch bloka za samu ponudu i
  // sendPushToUser sama po sebi guta sve greške (vidi src/lib/push.ts).
  const clientUserId = await getClientUserIdForShipment(shipmentId);
  if (clientUserId) {
    await sendPushToUser(clientUserId, {
      title: "Nova ponuda za vašu pošiljku",
      body: `${formatMoney(cena)} · dolazak za ~${procenjenoVremeMin} min`,
      url: `/klijent/posiljke/${shipmentId}`,
    });
  }

  // Intentionally no revalidatePath here: the courier should see the
  // "Ponuda je poslata klijentu." confirmation on THIS render first. The
  // page's own AutoRefresh (every 20s) — or the next navigation — will
  // naturally drop the request once it's no longer open for this courier.
  return { success: true };
}
