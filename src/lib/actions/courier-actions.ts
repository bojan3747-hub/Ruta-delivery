"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../auth";
import {
  activateCourier,
  getCourierByToken,
  updateCourierPricing,
} from "../queries/couriers";
import { ZONES } from "../zones";
import type { VehicleType, Zone } from "../types";
import type { ActionState } from "./auth-actions";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function selectedZones(formData: FormData): Zone[] {
  return ZONES.filter((zone) => formData.get(`zona_${zone}`) === "on");
}

export async function activateCourierAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const token = str(formData, "token");
  const email = str(formData, "email").toLowerCase();
  const password = str(formData, "password");
  const telefon = str(formData, "telefon");
  const pib = str(formData, "pib");
  const tipVozila = str(formData, "tipVozila") as VehicleType;
  const nosivostKg = Number(str(formData, "nosivostKg"));
  const zones = selectedZones(formData);

  if (!token) return { error: "Nevažeći link za aktivaciju." };
  if (!email || !password || !telefon || !pib || !tipVozila) {
    return { error: "Popunite sva obavezna polja." };
  }
  if (password.length < 6) {
    return { error: "Lozinka mora imati bar 6 karaktera." };
  }
  if (zones.length === 0) {
    return { error: "Izaberite bar jednu zonu pokrivenosti." };
  }
  if (!Number.isFinite(nosivostKg) || nosivostKg <= 0) {
    return { error: "Unesite validnu nosivost vozila (kg)." };
  }

  const courier = await getCourierByToken(token);
  if (!courier) return { error: "Nevažeći link za aktivaciju." };
  if (courier.status === "AKTIVAN") {
    return { error: "Ovaj nalog je već aktiviran. Prijavite se." };
  }

  try {
    await activateCourier({
      courierId: courier.id,
      email,
      password,
      telefon,
      pib,
      tipVozila,
      nosivostKg,
      zones,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Aktivacija nije uspela." };
  }

  redirect("/prijava?aktivirano=1");
}

export async function updatePricingAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "COURIER" || !user.courierId) {
    return { error: "Morate biti prijavljeni kao dostavljač." };
  }

  const cenaPoKm = Number(str(formData, "cenaPoKm"));
  const cenaPoKg = Number(str(formData, "cenaPoKg"));
  const minimalnaCena = Number(str(formData, "minimalnaCena"));
  const dnevniKapacitet = Number(str(formData, "dnevniKapacitet"));
  const zones = selectedZones(formData);

  if (
    !Number.isFinite(cenaPoKm) ||
    cenaPoKm <= 0 ||
    !Number.isFinite(cenaPoKg) ||
    cenaPoKg <= 0 ||
    !Number.isFinite(minimalnaCena) ||
    minimalnaCena <= 0
  ) {
    return { error: "Unesite validne cene (veće od 0)." };
  }
  if (!Number.isInteger(dnevniKapacitet) || dnevniKapacitet <= 0) {
    return { error: "Unesite validan dnevni kapacitet." };
  }
  if (zones.length === 0) {
    return { error: "Izaberite bar jednu zonu pokrivenosti." };
  }

  await updateCourierPricing(user.courierId, {
    cenaPoKm,
    cenaPoKg,
    minimalnaCena,
    dnevniKapacitet,
    zones,
  });

  revalidatePath("/dostavljac/cenovnik");
  return { success: true };
}
