"use client";

import { useActionState } from "react";
import { uploadOpstiUsloviAction } from "@/lib/actions/operator-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionState = {};

export function UploadOpstiUsloviForm() {
  const [state, formAction] = useActionState(uploadOpstiUsloviAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-sm font-medium">Novi PDF</label>
        <input
          type="file"
          name="pdf"
          accept="application/pdf"
          required
          className="mt-1 text-sm"
        />
      </div>
      <SubmitButton className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50">
        Postavi novu verziju
      </SubmitButton>
      <FormMessage error={state.error} />
      {state.success && (
        <p className="text-sm text-emerald-700">Postavljeno.</p>
      )}
    </form>
  );
}
