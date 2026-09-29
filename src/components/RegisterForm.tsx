"use client";

import { useState } from "react";
import { useActionState } from "react";
import { registerClientAction, type ActionState } from "@/lib/actions/auth-actions";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";
import { TermsCheckbox } from "./TermsCheckbox";
import { StreetNumberFields } from "./StreetNumberFields";
import { GoogleAuthButton } from "./GoogleAuthButton";
import { CLIENT_TYPE_LABELS } from "@/lib/labels";
import type { ClientType } from "@/lib/types";

const initialState: ActionState = {};

const inputClass =
  "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30";

// Faza 19a: klijent bira tip naloga pre popunjavanja ostatka forme — firma
// vidi nepromenjenu formu (naziv firme + PIB), fizičko lice preskače ta
// dva polja (njihovo ime i prezime iz "Kontakt osoba" sekcije ispod već
// služi kao identitet naloga, pa se šalje kao `naziv` na serveru).
export function RegisterForm() {
  const [state, formAction] = useActionState(registerClientAction, initialState);
  const [tipKlijenta, setTipKlijenta] = useState<ClientType>("FIRMA");
  const isFizickoLice = tipKlijenta === "FIZICKO_LICE";

  return (
    <div className="space-y-6">
      {/* Faza 20: Google prijava kreira nalog fizičkog lica direktno (vidi
          /registracija/google) — dostupna je samo za klijente, pa je forma
          ispod i dalje potrebna za firme i za one koji ne koriste Google. */}
      <GoogleAuthButton />
      <div className="flex items-center gap-3 text-xs text-neutral-400">
        <span className="h-px flex-1 bg-neutral-200" />
        ili se registrujte mejlom
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      <form action={formAction} className="space-y-6">
      <FormMessage error={state.error} />

      <input type="hidden" name="tipKlijenta" value={tipKlijenta} />

      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Registrujem se kao
        </legend>
        <div className="flex gap-2">
          {(Object.keys(CLIENT_TYPE_LABELS) as ClientType[]).map((tip) => (
            <button
              key={tip}
              type="button"
              onClick={() => setTipKlijenta(tip)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                tipKlijenta === tip
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-neutral-300 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {CLIENT_TYPE_LABELS[tip]}
            </button>
          ))}
        </div>
      </fieldset>

      {isFizickoLice ? (
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Adresa
          </legend>
          <div>
            <StreetNumberFields
              name="adresa"
              label="Adresa"
              inputClass={inputClass}
            />
          </div>
        </fieldset>
      ) : (
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
      )}

      <fieldset className="space-y-4">
        <legend className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {isFizickoLice ? "Vaši podaci" : "Kontakt osoba"}
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
        {isFizickoLice ? "Registruj se" : "Registruj firmu"}
      </SubmitButton>
      </form>
    </div>
  );
}
