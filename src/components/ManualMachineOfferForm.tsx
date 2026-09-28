"use client";

import { useActionState } from "react";
import { sendMachineOfferAction } from "@/lib/actions/machine-offer-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionState = {};

export function ManualMachineOfferForm({
  machineRequestId,
  defaultCena,
}: {
  machineRequestId: string;
  /** Predlog iz cenovnika mašine (cena po satu/danu), ako je podešen. */
  defaultCena?: number;
}) {
  const [state, formAction] = useActionState(sendMachineOfferAction, initialState);

  if (state.success) {
    return (
      <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 border border-emerald-200">
        Ponuda je poslata klijentu.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="machineRequestId" value={machineRequestId} />
      <FormMessage error={state.error} />
      {defaultCena != null && (
        <p className="text-xs text-neutral-500">
          Predlog iz vašeg cenovnika mašina — po potrebi izmenite pre slanja.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-neutral-600">
            Cena (RSD)
          </label>
          <input
            type="number"
            name="cena"
            min="0"
            step="0.01"
            required
            defaultValue={defaultCena}
            className="mt-1 w-full rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600">
            Procena trajanja
          </label>
          <input
            name="procenaTrajanja"
            required
            placeholder="npr. pola dana, 3-4 sata"
            className="mt-1 w-full rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
      </div>
      <input
        name="napomena"
        placeholder="Napomena (opciono)"
        className="w-full rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
      />
      <SubmitButton
        className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        pendingLabel="Slanje..."
      >
        Pošalji ponudu
      </SubmitButton>
    </form>
  );
}
