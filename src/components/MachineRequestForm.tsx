"use client";

import { useActionState, useState } from "react";
import { createMachineRequestAction } from "@/lib/actions/machine-request-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { ZONES, ZONE_LABELS } from "@/lib/zones";
import { MACHINE_TYPE_LABELS } from "@/lib/labels";
import type { MachineType } from "@/lib/types";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";
import { AddressPicker } from "./AddressPicker";

const initialState: ActionState = {};
const inputClass =
  "mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30";
const sectionClass =
  "space-y-4 rounded-lg border-l-4 border-neutral-300 bg-neutral-50 p-5";

const MACHINE_TYPES = Object.keys(MACHINE_TYPE_LABELS) as MachineType[];

export function MachineRequestForm({
  defaultContactName = "",
  defaultContactPhone = "",
}: {
  defaultContactName?: string;
  defaultContactPhone?: string;
}) {
  const [state, formAction] = useActionState(createMachineRequestAction, initialState);
  const [zona, setZona] = useState("");

  return (
    <form action={formAction} className="space-y-8">
      <FormMessage error={state.error} />

      <section className={sectionClass}>
        <h2 className="flex items-center gap-2 pb-1 text-xs font-semibold uppercase tracking-wide text-neutral-600">
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-600" />
          Lokacija posla
        </h2>

        <div>
          <label className="block text-sm font-medium">Zona *</label>
          <select
            name="zona"
            required
            className={inputClass}
            value={zona}
            onChange={(e) => setZona(e.target.value)}
          >
            <option value="" disabled>
              Izaberite zonu
            </option>
            {ZONES.map((z) => (
              <option key={z} value={z}>
                {ZONE_LABELS[z]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-neutral-500">
            Za sada pokrivamo samo Beograd.
          </p>
        </div>

        <AddressPicker name="adresa" label="Tačna adresa lokacije *" required />
      </section>

      <section className={sectionClass}>
        <h2 className="flex items-center gap-2 pb-1 text-xs font-semibold uppercase tracking-wide text-neutral-600">
          <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
          Posao
        </h2>

        <div>
          <label className="block text-sm font-medium">Tip mašine *</label>
          <select name="tipMasine" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Izaberite mašinu
            </option>
            {MACHINE_TYPES.map((t) => (
              <option key={t} value={t}>
                {MACHINE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-neutral-500">
            Mašina se uvek angažuje sa rukovaocem.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium">Opis posla *</label>
          <textarea
            name="opisPosla"
            required
            rows={5}
            placeholder="Opišite posao što detaljnije: vrsta terena, pristup lokaciji, obim posla, okvirno trajanje, kad Vam odgovara..."
            className={inputClass}
          />
          <p className="mt-1 text-xs text-neutral-500">
            Ne birate unapred termin/trajanje — izvođač na osnovu opisa šalje
            ponudu sa procenom cene i vremena.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium">Željeni termin (opciono)</label>
          <input
            name="zeljeniTermin"
            placeholder="npr. što pre, sledeće nedelje, fleksibilno"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Napomena (opciono)</label>
          <textarea
            name="napomena"
            rows={3}
            placeholder="Parking, pristup, kontakt osoba na licu mesta i sl."
            className={inputClass}
          />
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="flex items-center gap-2 pb-1 text-xs font-semibold uppercase tracking-wide text-neutral-600">
          <span className="h-2 w-2 shrink-0 rounded-full bg-amber-600" />
          Kontakt
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Ime i prezime *</label>
            <input
              name="kontaktIme"
              required
              defaultValue={defaultContactName}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Telefon *</label>
            <input
              name="kontaktTelefon"
              required
              defaultValue={defaultContactPhone}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <SubmitButton>Pošalji zahtev</SubmitButton>
    </form>
  );
}
