"use client";

import { useActionState } from "react";
import { setCommissionAction } from "@/lib/actions/operator-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionState = {};

export function CommissionForm({ current }: { current: number }) {
  const [state, formAction] = useActionState(setCommissionAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <FormMessage error={state.error} />
      <div>
        <label className="block text-sm font-medium">Procenat provizije (%)</label>
        <input
          type="number"
          name="procenat"
          min="0"
          max="100"
          step="0.1"
          required
          defaultValue={current}
          className="mt-1 w-32 rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>
      <SubmitButton pendingLabel="Čuvanje...">Sačuvaj</SubmitButton>
      {state.success && (
        <p className="text-sm text-emerald-600">Sačuvano.</p>
      )}
    </form>
  );
}
