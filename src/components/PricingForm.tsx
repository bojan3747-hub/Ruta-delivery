"use client";

import { useActionState } from "react";
import { updatePricingAction } from "@/lib/actions/courier-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { ZONES, ZONE_LABELS } from "@/lib/zones";
import type { Zone } from "@/lib/types";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionState = {};
const inputClass =
  "mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm";

export function PricingForm({
  defaults,
}: {
  defaults: {
    cenaPoKm: string | null;
    cenaPoKg: string | null;
    minimalnaCena: string | null;
    dnevniKapacitet: number;
    zones: Zone[];
  };
}) {
  const [state, formAction] = useActionState(updatePricingAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <FormMessage error={state.error} />
      {state.success && (
        <p className="text-sm text-emerald-700">Cenovnik je sačuvan.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium">Cena po km (RSD) *</label>
          <input
            type="number"
            name="cenaPoKm"
            step="0.01"
            min="0"
            required
            defaultValue={defaults.cenaPoKm ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Cena po kg (RSD) *</label>
          <input
            type="number"
            name="cenaPoKg"
            step="0.01"
            min="0"
            required
            defaultValue={defaults.cenaPoKg ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Minimalna cena (RSD) *</label>
          <input
            type="number"
            name="minimalnaCena"
            step="0.01"
            min="0"
            required
            defaultValue={defaults.minimalnaCena ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">
          Dnevni kapacitet (broj pošiljki) *
        </label>
        <input
          type="number"
          name="dnevniKapacitet"
          min="1"
          required
          defaultValue={defaults.dnevniKapacitet || ""}
          className={`${inputClass} max-w-[10rem]`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Zone pokrivenosti *</label>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ZONES.map((zone) => (
            <label key={zone} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name={`zona_${zone}`}
                defaultChecked={defaults.zones.includes(zone)}
                className="h-4 w-4"
              />
              {ZONE_LABELS[zone]}
            </label>
          ))}
        </div>
      </div>

      <SubmitButton>Sačuvaj cenovnik</SubmitButton>
    </form>
  );
}
