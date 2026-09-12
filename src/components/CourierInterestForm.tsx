"use client";

import { useActionState, useRef, useEffect } from "react";
import { submitCourierInterestAction } from "@/lib/actions/courier-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { ZONES, ZONE_LABELS } from "@/lib/zones";
import { VEHICLE_TYPE_LABELS } from "@/lib/labels";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionState = {};
const inputClass =
  "mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm";

// Faza 11: javna forma za prijavu interesovanja dostavljača, bez potrebe za
// nalogom — vidljiva svakome ko dođe na landing page (npr. sa Oglasa ili
// preko direktnog kontakta). Samo naziv i telefon su obavezni; ostalo je
// opciono i služi samo da operateru olakša prioritizaciju poziva.
export function CourierInterestForm() {
  const [state, formAction] = useActionState(
    submitCourierInterestAction,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="mx-auto max-w-xl space-y-4 text-left">
      <FormMessage error={state.error} />
      {state.success && state.message && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 border border-emerald-200">
          {state.message}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">
            Naziv firme/radnje *
          </label>
          <input name="naziv" required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium">Telefon *</label>
          <input name="telefon" required className={inputClass} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium">PIB</label>
          <input name="pib" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium">Tip vozila</label>
          <select name="tipVozila" className={inputClass} defaultValue="">
            <option value="">Izaberite (opciono)</option>
            {Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Nosivost (kg)</label>
          <input type="number" name="nosivostKg" min="1" className={inputClass} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium">Zone u kojima radite</label>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ZONES.map((zone) => (
            <label key={zone} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name={`zona_${zone}`} className="h-4 w-4" />
              {ZONE_LABELS[zone]}
            </label>
          ))}
        </div>
      </div>
      <SubmitButton
        className="w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50 sm:w-auto"
        pendingLabel="Slanje..."
      >
        Prijavite se za saradnju
      </SubmitButton>
    </form>
  );
}
