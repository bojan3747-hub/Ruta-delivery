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
          className="mt-1 rounded-md border border-black/15 px-3 py-2 text-sm"
        />
      </div>
      <SubmitButton className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50">
        Generiši fakture
      </SubmitButton>
      <FormMessage error={state.error} />
      {state.success && state.message && (
        <p className="text-sm text-emerald-700">{state.message}</p>
      )}
    </form>
  );
}
