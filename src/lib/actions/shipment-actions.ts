"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "../auth";
import { revalidatePath } from "next/cache";
import { cancelShipment, createShipment } from "../queries/shipments";
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
  const posiljalacIme = str(formData, "posiljalacIme");
  const posiljalacTelefon = str(formData, "posiljalacTelefon");
  const primalacIme = str(formData, "primalacIme");
  const primalacTelefon = str(formData, "primalacTelefon");
  const tip = str(formData, "tip") as ShipmentType;
  const hitno = formData.get("hitno") === "on";
  const nestandardna = formData.get("nestandardna") === "on";
  const zeljeniTermin = str(formData, "zeljeniTermin") as TerminType;
  const terminDetalji = str(formData, "terminDetalji");
  const napomena = str(formData, "napomena");
  const deklarisanaVrednost = Number(str(formData, "deklarisanaVrednost"));

  if (
    !zonaPreuzimanja ||
    !zonaIsporuke ||
    !adresaPreuzimanja ||
    !adresaIsporuke ||
    !posiljalacIme ||
    !posiljalacTelefon ||
    !primalacIme ||
    !primalacTelefon ||
    !tip ||
    !zeljeniTermin
  ) {
    return { error: "Popunite sva obavezna polja." };
  }
  if (!Number.isFinite(deklarisanaVrednost) || deklarisanaVrednost <= 0) {
    return { error: "Unesite validnu deklarisanu vrednost pošiljke (veću od 0)." };
  }
  if (zeljeniTermin !== "ODMAH" && !terminDetalji) {
    return {
      error:
        "Unesite tačno vreme/rok isporuke (npr. datum i sat) — dostavljaču mora biti jasno kada se očekuje preuzimanje.",
    };
  }

  const shipment = await createShipment({
    clientId: user.companyId,
    zonaPreuzimanja,
    zonaIsporuke,
    adresaPreuzimanja,
    adresaIsporuke,
    posiljalacIme,
    posiljalacTelefon,
    primalacIme,
    primalacTelefon,
    tip,
    hitno,
    nestandardna,
    zeljeniTermin,
    terminDetalji: terminDetalji || undefined,
    napomena: napomena || undefined,
    deklarisanaVrednost,
  });

  if (!nestandardna) {
    await createAutoOffers(shipment);
  }

  redirect(`/klijent/posiljke/${shipment.id}`);
}

export async function cancelShipmentAction(
  shipmentId: string
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT" || !user.companyId) {
    return { error: "Morate biti prijavljeni kao klijent." };
  }

  try {
    await cancelShipment(shipmentId, user.companyId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Greška." };
  }

  revalidatePath(`/klijent/posiljke/${shipmentId}`);
  revalidatePath("/klijent");
  return {};
}
