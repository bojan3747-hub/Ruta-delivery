"use client";

import { useActionState } from "react";
import { completeGoogleRegistrationAction, type ActionState } from "@/lib/actions/auth-actions";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";
import { TermsCheckbox } from "./TermsCheckbox";

const initialState: ActionState = {};

const inputClass =
  "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30";

// Faza 20: poslednji korak Google registracije — ime i email su već
// poznati (iz Google profila, prikazani samo za potvrdu), traži se jedino
// telefon (obavezan svuda u aplikaciji, Google ga ne daje) i prihvatanje
// uslova, isto kao kod redovne registracije.
export function GoogleRegistrationForm({
  ime,
  email,
}: {
  ime: string;
  email: string;
}) {
  const [state, formAction] = useActionState(completeGoogleRegistrationAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage error={state.error} />
      <div>
        <label className="block text-sm font-medium text-neutral-500">Ime i prezime</label>
        <input value={ime} disabled className={`${inputClass} bg-neutral-50 text-neutral-500`} />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-500">Email</label>
        <input value={email} disabled className={`${inputClass} bg-neutral-50 text-neutral-500`} />
      </div>
      <div>
        <label className="block text-sm font-medium">Telefon *</label>
        <input name="telefon" required className={inputClass} />
      </div>
      <TermsCheckbox />
      <SubmitButton
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        pendingLabel="Kreiranje naloga..."
      >
        Završi registraciju
      </SubmitButton>
    </form>
  );
}
