"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "../auth";
import { createShipment } from "../queries/shipments";
import { createAutoOffers } from "../queries/offers";
import type { ShipmentType, TerminType, Zone } from "../types";
import type { ActionState } from "./auth-actions";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function createShipmentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT" || !user.companyId) {
    return { error: "Morate biti prijavljeni kao klijent." };
  }

  const zonaPreuzimanja = str(formData, "zonaPreuzimanja") as Zone;
  const zonaIsporuke = str(formData, "zonaIsporuke") as Zone;
  const adresaPreuzimanja = str(formData, "adresaPreuzimanja");
  const adresaIsporuke = str(formData, "adresaIsporuke");
  const tip = str(formData, "tip") as ShipmentType;
  const hitno = formData.get("hitno") === "on";
  const nestandardna = formData.get("nestandardna") === "on";
  const zeljeniTermin = str(formData, "zeljeniTermin") as TerminType;
  const terminDetalji = str(formData, "terminDetalji");
  const napomena = str(formData, "napomena");

  if (
    !zonaPreuzimanja ||
    !zonaIsporuke ||
    !adresaPreuzimanja ||
    !adresaIsporuke ||
    !tip ||
    !zeljeniTermin
  ) {
    return { error: "Popunite sva obavezna polja." };
  }

  const shipment = await createShipment({
    clientId: user.companyId,
    zonaPreuzimanja,
    zonaIsporuke,
    adresaPreuzimanja,
    adresaIsporuke,
    tip,
    hitno,
    nestandardna,
    zeljeniTermin,
    terminDetalji: terminDetalji || undefined,
    napomena: napomena || undefined,
  });

  if (!nestandardna) {
    await createAutoOffers(shipment);
  }

  redirect(`/klijent/posiljke/${shipment.id}`);
}
