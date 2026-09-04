"use client";

import { useActionState } from "react";
import { registerClientAction, type ActionState } from "@/lib/actions/auth-actions";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionState = {};

const inputClass =
  "mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm";

export function RegisterForm() {
  const [state, formAction] = useActionState(registerClientAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage error={state.error} />

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-neutral-700">Firma</legend>
        <div>
          <label className="block text-sm font-medium">Naziv firme *</label>
          <input name="naziv" required className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">PIB</label>
            <input name="pib" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium">Adresa</label>
            <input name="adresa" className={inputClass} />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-neutral-700">
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

      <SubmitButton className="w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50">
        Registruj firmu
      </SubmitButton>
    </form>
  );
}
