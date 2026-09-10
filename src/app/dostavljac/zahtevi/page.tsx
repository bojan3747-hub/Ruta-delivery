import { getCurrentUser } from "@/lib/auth";
import {
  MANUAL_REQUEST_WINDOW_MINUTES,
  listOpenRequestsForCourier,
} from "@/lib/queries/shipments";
import { getCourierById } from "@/lib/queries/couriers";
import { computeAutoQuote } from "@/lib/pricing";
import { ZONE_LABELS } from "@/lib/zones";
import {
  SHIPMENT_CONTENT_LABELS,
  SHIPMENT_TYPE_LABELS,
  SPECIAL_CARGO_LABELS,
  TERMIN_LABELS,
  formatMoney,
} from "@/lib/labels";
import { ManualOfferForm } from "@/components/ManualOfferForm";
import { AutoRefresh } from "@/components/AutoRefresh";

function minutesLeft(createdAt: string): number {
  const deadline = new Date(createdAt).getTime() + MANUAL_REQUEST_WINDOW_MINUTES * 60_000;
  return Math.max(0, Math.round((deadline - Date.now()) / 60_000));
}

export default async function ZahteviPage() {
  const user = await getCurrentUser();
  const courier = user?.courierId ? await getCourierById(user.courierId) : null;
  const requests = user?.courierId
    ? await listOpenRequestsForCourier(user.courierId)
    : [];

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={20000} />
      <div>
        <h1 className="text-2xl font-semibold">Zahtevi za ponude</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Sve otvorene pošiljke (standardne i nestandardne) u vašim zonama za
          koje još niste poslali ponudu. Standardne pošiljke ostaju vidljive
          dok neko ne ponudi; za nestandardne imate{" "}
          {MANUAL_REQUEST_WINDOW_MINUTES} minuta od prijema zahteva.
        </p>
      </div>

      {requests.length === 0 ? (
        <p className="rounded-lg border border-dashed border-black/15 p-8 text-center text-neutral-500">
          Trenutno nema otvorenih zahteva u vašim zonama.
        </p>
      ) : (
        <ul className="space-y-4">
          {requests.map((s) => {
            const quote = courier ? computeAutoQuote(courier, s) : null;
            return (
            <li key={s.id} className="rounded-lg border border-black/10 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {ZONE_LABELS[s.zona_preuzimanja]} → {ZONE_LABELS[s.zona_isporuke]}
                  </p>
                  <p className="text-sm text-neutral-500">
                    Klijent: {s.client_naziv}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {SHIPMENT_TYPE_LABELS[s.tip]}
                    {s.sadrzaj_posiljke
                      ? ` · ${SHIPMENT_CONTENT_LABELS[s.sadrzaj_posiljke]}`
                      : ""}
                    {s.posebna_kategorija_tereta
                      ? ` · ${SPECIAL_CARGO_LABELS[s.posebna_kategorija_tereta]}`
                      : ""}
                    {s.hitno ? " · Hitno" : ""}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-neutral-800">
                    Rok isporuke: {TERMIN_LABELS[s.zeljeni_termin]}
                    {s.termin_detalji ? ` — ${s.termin_detalji}` : ""}
                  </p>
                  {quote && (
                    <p className="text-sm text-neutral-500">
                      Udaljenost: ~{quote.distanceKm} km
                      {s.udaljenost_km == null ? " (procena po zonama)" : ""}
                    </p>
                  )}
                  {s.deklarisana_vrednost && (
                    <p className="mt-1 text-sm text-neutral-500">
                      Deklarisana vrednost: {formatMoney(s.deklarisana_vrednost)}
                    </p>
                  )}
                  <div className="mt-2 grid gap-x-4 gap-y-0.5 text-sm text-neutral-600 sm:grid-cols-2">
                    <p>
                      <span className="text-neutral-400">Preuzimanje:</span>{" "}
                      {s.adresa_preuzimanja}
                      {s.posiljalac_ime ? ` — ${s.posiljalac_ime}` : ""}
                      {s.posiljalac_telefon ? ` (${s.posiljalac_telefon})` : ""}
                    </p>
                    <p>
                      <span className="text-neutral-400">Isporuka:</span>{" "}
                      {s.adresa_isporuke}
                      {s.primalac_ime ? ` — ${s.primalac_ime}` : ""}
                      {s.primalac_telefon ? ` (${s.primalac_telefon})` : ""}
                    </p>
                  </div>
                  {s.napomena && (
                    <p className="mt-1 text-sm text-neutral-700">{s.napomena}</p>
                  )}
                </div>
                {s.nestandardna ? (
                  <span className="whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                    još ~{minutesLeft(s.created_at)} min
                  </span>
                ) : (
                  <span className="whitespace-nowrap rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
                    Standardna
                  </span>
                )}
              </div>
              <div className="mt-4 border-t border-black/10 pt-4">
                <ManualOfferForm
                  shipmentId={s.id}
                  defaultCena={quote?.cenaEur}
                  defaultProcenjenoVremeMin={quote?.procenjenoVremeMin}
                />
              </div>
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
