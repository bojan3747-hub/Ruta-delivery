"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../auth";
import { createSavedAddress, deleteSavedAddress } from "../queries/saved-addresses";
import { ZONES } from "../zones";
import type { Zone } from "../types";
import type { ActionState } from "./auth-actions";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function createSavedAddressAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !user.companyId) {
    return { error: "Morate biti prijavljeni kao klijent." };
  }

  const naziv = str(formData, "naziv");
  const adresa = str(formData, "adresa");
  const zona = str(formData, "zona") as Zone;

  if (!naziv || !adresa) {
    return { error: "Popunite naziv i adresu." };
  }
  if (!ZONES.includes(zona)) {
    return { error: "Izaberite zonu." };
  }

  await createSavedAddress({ companyId: user.companyId, naziv, adresa, zona });
  revalidatePath("/klijent/adrese");
  revalidatePath("/klijent/nova-posiljka");
  return { success: true };
}

export async function deleteSavedAddressAction(
  addressId: string
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user || !user.companyId) {
    return { error: "Morate biti prijavljeni kao klijent." };
  }

  try {
    await deleteSavedAddress(addressId, user.companyId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Greška." };
  }

  revalidatePath("/klijent/adrese");
  revalidatePath("/klijent/nova-posiljka");
  return {};
}
