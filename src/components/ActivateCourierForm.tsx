"use client";

import { useActionState } from "react";
import { activateCourierAction } from "@/lib/actions/courier-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { ZONES, ZONE_LABELS } from "@/lib/zones";
import { VEHICLE_TYPE_LABELS } from "@/lib/labels";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionState = {};
const inputClass =
  "mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm";

export function ActivateCourierForm({
  token,
  telefon,
}: {
  token: string;
  telefon: string;
}) {
  const [state, formAction] = useActionState(activateCourierAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <FormMessage error={state.error} />

      <div>
        <label className="block text-sm font-medium">Email (za prijavu) *</label>
        <input type="email" name="email" required className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium">Lozinka *</label>
        <input
          type="password"
          name="password"
          required
          minLength={6}
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Telefon *</label>
        <input
          name="telefon"
          required
          defaultValue={telefon}
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-sm font-medium">PIB *</label>
        <input name="pib" required className={inputClass} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Tip vozila *</label>
          <select name="tipVozila" required className={inputClass} defaultValue="">
            <option value="" disabled>
              Izaberite
            </option>
            {Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Nosivost (kg) *</label>
          <input
            type="number"
            name="nosivostKg"
            min="1"
            required
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Zone pokrivenosti *</label>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ZONES.map((zone) => (
            <label key={zone} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name={`zona_${zone}`} className="h-4 w-4" />
              {ZONE_LABELS[zone]}
            </label>
          ))}
        </div>
      </div>

      <SubmitButton className="w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50">
        Aktiviraj nalog
      </SubmitButton>
    </form>
  );
}
