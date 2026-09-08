"use client";

import {
  useActionState,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  createShipmentAction,
} from "@/lib/actions/shipment-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { ZONES, ZONE_LABELS } from "@/lib/zones";
import {
  SHIPMENT_CONTENT_LABELS,
  SHIPMENT_TYPE_LABELS,
  SPECIAL_CARGO_LABELS,
  TERMIN_LABELS,
} from "@/lib/labels";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";
import { AddressPicker } from "./AddressPicker";
import type { SavedAddressRow } from "@/lib/types";

const initialState: ActionState = {};
const inputClass =
  "mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm";

// Faza 5, opcija C ("Neutralna + akcenat"): sve tri sekcije forme dobijaju
// istu neutralno sivu pozadinu/traku, a boja se koristi samo na maloj
// tački pored naslova radi brzog vizuelnog razlikovanja. Vidi
// forma-vizuelni-predlozi.html / forma-boje-predlozi.html (poslati u chat
// 2026-09-08) — ovo su tačne boje koje je korisnik izabrao.
const sectionClass =
  "space-y-4 rounded-lg border-l-4 border-neutral-300 bg-neutral-50 p-5";

function SectionHeading({
  dotClassName,
  children,
}: {
  dotClassName: string;
  children: ReactNode;
}) {
  return (
    <h2 className="flex items-center gap-2 pb-1 text-xs font-semibold uppercase tracking-wide text-neutral-600">
      <span className={`h-2 w-2 shrink-0 rounded-full ${dotClassName}`} />
      {children}
    </h2>
  );
}

export function ShipmentForm({
  savedAddresses = [],
  defaultSenderName = "",
  defaultSenderPhone = "",
  defaultSenderAddress = "",
}: {
  savedAddresses?: SavedAddressRow[];
  /** Prefilled from the logged-in contact person — still editable per shipment. */
  defaultSenderName?: string;
  defaultSenderPhone?: string;
  /** Prefilled from the company's registered (sedište) address. */
  defaultSenderAddress?: string;
}) {
  const [state, formAction] = useActionState(createShipmentAction, initialState);
  const [zeljeniTermin, setZeljeniTermin] = useState("ODMAH");

  const [zonaPreuzimanja, setZonaPreuzimanja] = useState("");
  const [zonaIsporuke, setZonaIsporuke] = useState("");

  const [pickupAddress, setPickupAddress] = useState({
    value: defaultSenderAddress,
    key: 0,
  });
  const [deliveryAddress, setDeliveryAddress] = useState({ value: "", key: 0 });

  function applySavedAddress(
    addressId: string,
    setZona: (z: string) => void,
    setAddress: Dispatch<SetStateAction<{ value: string; key: number }>>
  ) {
    const saved = savedAddresses.find((a) => a.id === addressId);
    if (!saved) return;
    setZona(saved.zona);
    setAddress((prev) => ({ value: saved.adresa, key: prev.key + 1 }));
  }

  return (
    <form action={formAction} className="space-y-8">
      <FormMessage error={state.error} />

      <section className={sectionClass}>
        <SectionHeading dotClassName="bg-emerald-700">
          Podaci o pošiljaocu
        </SectionHeading>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Ime i prezime *</label>
            <input
              name="posiljalacIme"
              required
              defaultValue={defaultSenderName}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Telefon *</label>
            <input
              name="posiljalacTelefon"
              required
              defaultValue={defaultSenderPhone}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Zona preuzimanja *</label>
          <select
            name="zonaPreuzimanja"
            required
            className={inputClass}
            value={zonaPreuzimanja}
            onChange={(e) => setZonaPreuzimanja(e.target.value)}
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
        </div>

        {savedAddresses.length > 0 && (
          <div>
            <label className="block text-sm font-medium">Sačuvana adresa preuzimanja</label>
            <select
              defaultValue=""
              className={inputClass}
              onChange={(e) => {
                applySavedAddress(e.target.value, setZonaPreuzimanja, setPickupAddress);
                e.target.value = "";
              }}
            >
              <option value="" disabled>
                Izaberite (opciono)
              </option>
              {savedAddresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.naziv}
                </option>
              ))}
            </select>
          </div>
        )}

        <AddressPicker
          key={pickupAddress.key}
          name="adresaPreuzimanja"
          label="Tačna adresa preuzimanja *"
          required
          initialValue={pickupAddress.value}
        />
        {defaultSenderAddress && (
          <p className="text-xs text-neutral-500">
            Predlog adrese je preuzet iz podataka o sedištu firme — po potrebi izmenite.
          </p>
        )}
      </section>

      <section className={sectionClass}>
        <SectionHeading dotClassName="bg-blue-600">
          Podaci o primaocu
        </SectionHeading>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Ime i prezime *</label>
            <input name="primalacIme" required className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium">Telefon *</label>
            <input name="primalacTelefon" required className={inputClass} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Zona isporuke *</label>
          <select
            name="zonaIsporuke"
            required
            className={inputClass}
            value={zonaIsporuke}
            onChange={(e) => setZonaIsporuke(e.target.value)}
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
        </div>

        {savedAddresses.length > 0 && (
          <div>
            <label className="block text-sm font-medium">Sačuvana adresa isporuke</label>
            <select
              defaultValue=""
              className={inputClass}
              onChange={(e) => {
                applySavedAddress(e.target.value, setZonaIsporuke, setDeliveryAddress);
                e.target.value = "";
              }}
            >
              <option value="" disabled>
                Izaberite (opciono)
              </option>
              {savedAddresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.naziv}
                </option>
              ))}
            </select>
          </div>
        )}

        <AddressPicker
          key={`d-${deliveryAddress.key}`}
          name="adresaIsporuke"
          label="Tačna adresa isporuke *"
          required
          initialValue={deliveryAddress.value}
        />
      </section>

      <section className={sectionClass}>
        <SectionHeading dotClassName="bg-amber-700">
          Podaci o pošiljci
        </SectionHeading>

        <div>
          <label className="block text-sm font-medium">
            Deklarisana vrednost pošiljke (RSD) *
          </label>
          <input
            type="number"
            name="deklarisanaVrednost"
            min="1"
            step="1"
            required
            className={inputClass}
          />
          <p className="mt-1 text-xs text-neutral-500">
            Dostavljač odgovara za pošiljku do ovog iznosa, od preuzimanja do isporuke.
          </p>
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

        <div>
          <label className="block text-sm font-medium">Sadržaj pošiljke *</label>
          <select name="sadrzajPosiljke" required className={inputClass} defaultValue="">
            <option value="" disabled>
              Izaberite sadržaj
            </option>
            {Object.entries(SHIPMENT_CONTENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">
            Posebna kategorija tereta (opciono)
          </label>
          <select name="posebnaKategorijaTereta" className={inputClass} defaultValue="">
            <option value="">Nije posebna kategorija</option>
            {Object.entries(SPECIAL_CARGO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-neutral-500">
            Popunite samo ako pošiljka spada u neku od posebnih kategorija
            tereta (gume, delovi vozila, palete i sl.) — utiče na cenu i
            način transporta.
          </p>
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
          <p className="mt-1 text-xs text-neutral-500">
            &ldquo;Odmah&rdquo; znači u toku dana, čim se javi dostavljač. Za
            &ldquo;Danas do&rdquo; ili &ldquo;Zakazano&rdquo; morate uneti tačan
            rok ispod — to je krajnji rok isporuke koji dostavljač vidi i na koji
            se obavezuje.
          </p>
        </div>

        {zeljeniTermin !== "ODMAH" && (
          <div>
            <label className="block text-sm font-medium">
              Tačan rok isporuke (datum/sat) *
            </label>
            <input
              name="terminDetalji"
              required
              placeholder={
                zeljeniTermin === "DANAS_DO" ? "npr. danas do 17h" : "npr. 8.9. do 12h"
              }
              className={inputClass}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium">Napomena</label>
          <textarea name="napomena" rows={3} className={inputClass} />
        </div>
      </section>

      <SubmitButton
        className="w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
        pendingLabel="Slanje zahteva..."
      >
        Zatraži ponude
      </SubmitButton>
    </form>
  );
}
