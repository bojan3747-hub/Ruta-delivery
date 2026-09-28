"use client";

import { useState } from "react";
import { useActionState } from "react";
import { updateCourierMachinesAction } from "@/lib/actions/courier-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { MACHINE_TYPE_LABELS } from "@/lib/labels";
import type { CourierMachineRow, MachineType } from "@/lib/types";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionState = {};
const inputClass =
  "mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30";

const MACHINE_TYPES = Object.keys(MACHINE_TYPE_LABELS) as MachineType[];

// Faza 19b: dostavljač bira koje mašine nudi za "Angažovanje mašina" — SVE
// isključivo sa rukovaocem. Cena po satu/danu je opciona (indikativna, samo
// orijentaciona vrednost — svaki konkretan posao i dalje dobija ručnu
// ponudu, isto kao nestandardne pošiljke).
export function MachineFleetForm({
  defaults,
}: {
  defaults: CourierMachineRow[];
}) {
  const [state, formAction] = useActionState(updateCourierMachinesAction, initialState);
  const defaultsByType = new Map(defaults.map((d) => [d.tip_masine, d]));
  const [checked, setChecked] = useState<Set<MachineType>>(
    new Set(defaults.map((d) => d.tip_masine))
  );

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage error={state.error} />
      {state.success && (
        <p className="text-sm text-emerald-600">Mašine su sačuvane.</p>
      )}

      <div className="space-y-2">
        {MACHINE_TYPES.map((tip) => {
          const existing = defaultsByType.get(tip);
          const isChecked = checked.has(tip);
          return (
            <div
              key={tip}
              className={`rounded-lg border p-3 ${
                isChecked ? "border-emerald-300 bg-emerald-50/50" : "border-black/10"
              }`}
            >
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  name={`masina_${tip}`}
                  checked={isChecked}
                  onChange={(e) => {
                    setChecked((prev) => {
                      const next = new Set(prev);
                      if (e.target.checked) next.add(tip);
                      else next.delete(tip);
                      return next;
                    });
                  }}
                  className="h-4 w-4"
                />
                {MACHINE_TYPE_LABELS[tip]}
              </label>
              {isChecked && (
                <div className="mt-2 grid gap-3 pl-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-neutral-500">
                      Indikativna cena po satu (RSD, opciono)
                    </label>
                    <input
                      type="number"
                      name={`cenaPoSatu_${tip}`}
                      step="0.01"
                      min="0"
                      defaultValue={existing?.cena_po_satu ?? ""}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500">
                      Indikativna cena po danu (RSD, opciono)
                    </label>
                    <input
                      type="number"
                      name={`cenaPoDanu_${tip}`}
                      step="0.01"
                      min="0"
                      defaultValue={existing?.cena_po_danu ?? ""}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-neutral-500">
        Cena je samo orijentaciona — za svaki konkretan zahtev i dalje šaljete
        ručnu ponudu sa tačnom cenom i procenom vremena.
      </p>

      <SubmitButton pendingLabel="Čuvanje...">Sačuvaj mašine</SubmitButton>
    </form>
  );
}
