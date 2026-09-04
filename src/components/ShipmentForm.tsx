"use client";

import { useActionState, useState } from "react";
import {
  createShipmentAction,
} from "@/lib/actions/shipment-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { ZONES, ZONE_LABELS } from "@/lib/zones";
import { SHIPMENT_TYPE_LABELS, TERMIN_LABELS } from "@/lib/labels";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionState = {};
const inputClass =
  "mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm";

export function ShipmentForm() {
  const [state, formAction] = useActionState(createShipmentAction, initialState);
  const [zeljeniTermin, setZeljeniTermin] = useState("ODMAH");

  return (
    <form action={formAction} className="space-y-5">
      <FormMessage error={state.error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Zona preuzimanja *</label>
          <select name="zonaPreuzimanja" required className={inputClass} defaultValue="">
            <option value="" disabled>
              Izaberite zonu
            </option>
            {ZONES.map((z) => (
              <option key={z} value={z}>
                {ZONE_LABELS[z]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Zona isporuke *</label>
          <select name="zonaIsporuke" required className={inputClass} defaultValue="">
            <option value="" disabled>
              Izaberite zonu
            </option>
            {ZONES.map((z) => (
              <option key={z} value={z}>
                {ZONE_LABELS[z]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">
            Tačna adresa preuzimanja *
          </label>
          <input name="adresaPreuzimanja" required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium">
            Tačna adresa isporuke *
          </label>
          <input name="adresaIsporuke" required className={inputClass} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Tip pošiljke *</label>
        <select name="tip" required className={inputClass} defaultValue="">
          <option value="" disabled>
            Izaberite tip
          </option>
          {Object.entries(SHIPMENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="hitno" className="h-4 w-4" />
          Hitno
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="nestandardna" className="h-4 w-4" />
          Nestandardna pošiljka (paleta, krhka roba, veća količina)
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium">Željeni termin preuzimanja *</label>
        <select
          name="zeljeniTermin"
          required
          className={inputClass}
          value={zeljeniTermin}
          onChange={(e) => setZeljeniTermin(e.target.value)}
        >
          {Object.entries(TERMIN_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {zeljeniTermin !== "ODMAH" && (
        <div>
          <label className="block text-sm font-medium">Detalji termina</label>
          <input
            name="terminDetalji"
            placeholder={zeljeniTermin === "DANAS_DO" ? "npr. do 17h" : "npr. sutra ujutru"}
            className={inputClass}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium">Napomena</label>
        <textarea name="napomena" rows={3} className={inputClass} />
      </div>

      <SubmitButton className="w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50">
        Zatraži ponude
      </SubmitButton>
    </form>
  );
}
