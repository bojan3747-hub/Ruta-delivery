"use client";

import { useActionState } from "react";
import { sendManualOfferAction } from "@/lib/actions/offer-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionState = {};

export function ManualOfferForm({
  shipmentId,
  defaultCena,
  defaultProcenjenoVremeMin,
}: {
  shipmentId: string;
  /** Predlog iz kurirovog cenovnika (ako je podešen) — i dalje izmenljivo. */
  defaultCena?: number;
  defaultProcenjenoVremeMin?: number;
}) {
  const [state, formAction] = useActionState(sendManualOfferAction, initialState);

  if (state.success) {
    return (
      <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 border border-emerald-200">
        Ponuda je poslata klijentu.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="shipmentId" value={shipmentId} />
      <FormMessage error={state.error} />
      {defaultCena != null && (
        <p className="text-xs text-neutral-500">
          Predlog iz vašeg cenovnika — po potrebi izmenite pre slanja.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
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
            className="mt-1 w-full rounded-md border border-black/15 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600">
            Procenjeno vreme (min)
          </label>
          <input
            type="number"
            name="procenjenoVremeMin"
            min="1"
            required
            defaultValue={defaultProcenjenoVremeMin}
            className="mt-1 w-full rounded-md border border-black/15 px-3 py-1.5 text-sm"
          />
        </div>
      </div>
      <input
        name="napomena"
        placeholder="Napomena (opciono)"
        className="w-full rounded-md border border-black/15 px-3 py-1.5 text-sm"
      />
      <SubmitButton
        className="rounded-md bg-emerald-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
        pendingLabel="Slanje..."
      >
        Pošalji ponudu
      </SubmitButton>
    </form>
  );
}
