"use client";

import { useActionState, useRef, useEffect } from "react";
import { createPreApprovedCourierAction } from "@/lib/actions/operator-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionState = {};
const inputClass = "mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm";

export function CreatePreApprovedCourierForm() {
  const [state, formAction] = useActionState(
    createPreApprovedCourierAction,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <FormMessage error={state.error} />
      {state.success && (
        <p className="text-sm text-emerald-700">
          Nalog je kreiran — link za aktivaciju je u listi ispod.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium">Naziv firme/dostavljača *</label>
          <input name="naziv" required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium">Telefon *</label>
          <input name="telefon" required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium">Izvor kontakta *</label>
          <select name="izvorKontakta" required className={inputClass} defaultValue="">
            <option value="" disabled>
              Izaberite
            </option>
            <option value="APR">APR</option>
            <option value="Oglasi">Oglasi</option>
            <option value="Preporuka">Preporuka</option>
            <option value="Drugo">Drugo</option>
          </select>
        </div>
      </div>
      <SubmitButton className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50">
        Kreiraj pre-approved nalog
      </SubmitButton>
    </form>
  );
}
