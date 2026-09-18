"use client";

import { useActionState } from "react";
import { registerClientAction, type ActionState } from "@/lib/actions/auth-actions";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";
import { TermsCheckbox } from "./TermsCheckbox";
import { StreetNumberFields } from "./StreetNumberFields";

const initialState: ActionState = {};

const inputClass =
  "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30";

export function RegisterForm() {
  const [state, formAction] = useActionState(registerClientAction, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <FormMessage error={state.error} />

      <fieldset className="space-y-4">
        <legend className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Podaci o firmi
        </legend>
        <div>
          <label className="block text-sm font-medium">Naziv firme *</label>
          <input name="naziv" required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium">PIB</label>
          <input name="pib" className={inputClass} />
        </div>
        <div>
          <StreetNumberFields
            name="adresa"
            label="Adresa"
            inputClass={inputClass}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Kontakt osoba
        </legend>
        <div>
          <label className="block text-sm font-medium">Ime i prezime *</label>
          <input name="ime" required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium">Telefon *</label>
          <input name="telefon" required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium">Email *</label>
          <input type="email" name="email" required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium">Lozinka *</label>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            className={inputClass}
          />
        </div>
      </fieldset>

      <TermsCheckbox />

      <SubmitButton
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        pendingLabel="Registracija..."
      >
        Registruj firmu
      </SubmitButton>
    </form>
  );
}
