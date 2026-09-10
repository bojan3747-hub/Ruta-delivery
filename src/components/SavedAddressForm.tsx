"use client";

import { useActionState } from "react";
import { createSavedAddressAction } from "@/lib/actions/saved-address-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { ZONES, ZONE_LABELS } from "@/lib/zones";
import { ADDRESS_TYPE_LABELS } from "@/lib/labels";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";
import { StreetNumberFields } from "./StreetNumberFields";

const initialState: ActionState = {};
const inputClass = "mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm";

export function SavedAddressForm() {
  const [state, formAction] = useActionState(createSavedAddressAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <FormMessage error={state.error} />
      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label className="block text-sm font-medium">Naziv *</label>
          <input
            name="naziv"
            required
            placeholder="npr. Sedište"
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <StreetNumberFields
            name="adresa"
            label="Adresa *"
            required
            inputClass={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Zona *</label>
          <select name="zona" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Izaberite zonu
            </option>
            {ZONES.map((z) => (
              <option key={z} value={z}>
                {ZONE_LABELS[z]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Koristi se za *</label>
          <select name="tip" required defaultValue="OBA" className={inputClass}>
            {Object.entries(ADDRESS_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Poštanski broj</label>
          <input
            name="postanskiBroj"
            placeholder="npr. 11000"
            className={inputClass}
          />
        </div>
      </div>
      <SubmitButton
        className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
        pendingLabel="Čuvanje..."
      >
        Sačuvaj adresu
      </SubmitButton>
    </form>
  );
}
