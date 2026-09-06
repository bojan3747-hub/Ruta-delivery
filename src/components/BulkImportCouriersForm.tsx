"use client";

import { useActionState } from "react";
import { bulkImportCouriersAction } from "@/lib/actions/operator-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionState = {};

export function BulkImportCouriersForm() {
  const [state, formAction] = useActionState(
    bulkImportCouriersAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <p className="text-sm font-medium">Uvoz iz CSV-a</p>
        <p className="mt-1 text-sm text-neutral-500">
          Prvi red mora biti zaglavlje sa kolonama{" "}
          <code className="rounded bg-black/5 px-1">naziv</code>,{" "}
          <code className="rounded bg-black/5 px-1">telefon</code> i opciono{" "}
          <code className="rounded bg-black/5 px-1">izvor_kontakta</code>.
          Dostavljači se dodaju kao &ldquo;na potvrdi&rdquo;, isto kao kad se
          unesu ručno.
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <input
          type="file"
          name="csv"
          accept=".csv,text/csv"
          required
          className="text-sm"
        />
        <SubmitButton className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50">
          Uvezi
        </SubmitButton>
      </div>
      <FormMessage error={state.error} />
      {state.success && (
        <p className="whitespace-pre-line rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 border border-emerald-200">
          {state.message}
        </p>
      )}
    </form>
  );
}
