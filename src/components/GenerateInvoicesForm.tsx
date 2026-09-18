"use client";

import { useActionState } from "react";
import { generateInvoicesAction } from "@/lib/actions/operator-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionState = {};

function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function GenerateInvoicesForm() {
  const [state, formAction] = useActionState(generateInvoicesAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-sm font-medium">Mesec</label>
        <input
          type="month"
          name="period"
          required
          defaultValue={currentMonthValue()}
          className="mt-1 rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>
      <SubmitButton
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        pendingLabel="Generisanje..."
      >
        Generiši fakture
      </SubmitButton>
      <FormMessage error={state.error} />
      {state.success && state.message && (
        <p className="text-sm text-emerald-600">{state.message}</p>
      )}
    </form>
  );
}
