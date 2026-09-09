import { getCurrentUser } from "@/lib/auth";
import { listCompletedOrdersForCourier, listOrdersForCourier } from "@/lib/queries/orders";
import { ZONE_LABELS } from "@/lib/zones";
import {
  ORDER_STATUS_LABELS,
  SHIPMENT_CONTENT_LABELS,
  SHIPMENT_TYPE_LABELS,
  SPECIAL_CARGO_LABELS,
  TERMIN_LABELS,
  formatMoney,
} from "@/lib/labels";
import { StatusBadge } from "@/components/StatusBadge";
import { AdvanceOrderButton } from "@/components/AdvanceOrderButton";
import { CancelOrderButton } from "@/components/CancelOrderButton";
import { RatingForm } from "@/components/RatingForm";

export default async function AktivneIsporukePage() {
  const user = await getCurrentUser();
  const [orders, completed] = user?.courierId
    ? await Promise.all([
        listOrdersForCourier(user.courierId),
        listCompletedOrdersForCourier(user.courierId),
      ])
    : [[], []];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Aktivne isporuke</h1>

      {orders.length === 0 ? (
        <p className="rounded-lg border border-dashed border-black/15 p-8 text-center text-neutral-500">
          Nemate aktivnih isporuka.
        </p>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o.id} className="rounded-lg border border-black/10 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {ZONE_LABELS[o.zona_preuzimanja]} → {ZONE_LABELS[o.zona_isporuke]}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {SHIPMENT_TYPE_LABELS[o.tip]}
                    {o.sadrzaj_posiljke
                      ? ` · ${SHIPMENT_CONTENT_LABELS[o.sadrzaj_posiljke]}`
                      : ""}
                    {o.posebna_kategorija_tereta
                      ? ` · ${SPECIAL_CARGO_LABELS[o.posebna_kategorija_tereta]}`
                      : ""}
                    {o.hitno ? " · Hitno" : ""} · {formatMoney(o.cena)}
                  </p>
                  <p className="mt-1 text-sm font-medium text-neutral-800">
                    Rok isporuke: {TERMIN_LABELS[o.zeljeni_termin]}
                    {o.termin_detalji ? ` — ${o.termin_detalji}` : ""}
                    {o.udaljenost_km ? ` · ~${Number(o.udaljenost_km)} km` : ""}
                  </p>
                  <div className="mt-2 grid gap-x-4 gap-y-0.5 text-sm text-neutral-600 sm:grid-cols-2">
                    <p>
                      <span className="text-neutral-400">Preuzimanje:</span>{" "}
                      {o.adresa_preuzimanja}
                      {o.posiljalac_ime ? ` — ${o.posiljalac_ime}` : ""}
                      {o.posiljalac_telefon ? ` (${o.posiljalac_telefon})` : ""}
                    </p>
                    <p>
                      <span className="text-neutral-400">Isporuka:</span>{" "}
                      {o.adresa_isporuke}
                      {o.primalac_ime ? ` — ${o.primalac_ime}` : ""}
                      {o.primalac_telefon ? ` (${o.primalac_telefon})` : ""}
                    </p>
                  </div>
                  {o.napomena && (
                    <p className="mt-1 text-sm text-neutral-700">{o.napomena}</p>
                  )}
                  {o.client_telefon && (
                    <p className="mt-1 text-sm text-neutral-500">
                      Kontakt firme: {o.client_kontakt_ime} · {o.client_telefon}
                    </p>
                  )}
                  {o.deklarisana_vrednost && (
                    <p className="mt-1 text-sm text-neutral-500">
                      Odgovarate za pošiljku do: {formatMoney(o.deklarisana_vrednost)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={o.status} label={ORDER_STATUS_LABELS[o.status]} />
                  <AdvanceOrderButton orderId={o.id} status={o.status} />
                  <CancelOrderButton orderId={o.id} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {completed.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Nedavno završene</h2>
          <ul className="space-y-3">
            {completed.map((o) => (
              <li key={o.id} className="rounded-lg border border-black/10 bg-white p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {ZONE_LABELS[o.zona_preuzimanja]} → {ZONE_LABELS[o.zona_isporuke]}
                    </p>
                    <p className="text-neutral-500">
                      Klijent: {o.client_naziv} ·{" "}
                      {o.adresa_preuzimanja} → {o.adresa_isporuke} ·{" "}
                      {formatMoney(o.cena)}
                      {o.provizija ? ` · Provizija: ${formatMoney(o.provizija)}` : ""}
                    </p>
                    {o.sadrzaj_posiljke && (
                      <p className="text-neutral-500">
                        {SHIPMENT_CONTENT_LABELS[o.sadrzaj_posiljke]}
                      </p>
                    )}
                  </div>
                  {o.has_fotografija && (
                    <a
                      href={`/api/posiljke/${o.shipment_id}/fotografija`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:underline"
                    >
                      Foto-dokaz
                    </a>
                  )}
                </div>
                {o.client_rating_ocena ? (
                  <p className="mt-2 text-neutral-600">
                    Ocenili ste klijenta sa {o.client_rating_ocena} ★
                    {o.client_rating_komentar ? ` — "${o.client_rating_komentar}"` : ""}
                  </p>
                ) : (
                  <div className="mt-3">
                    <RatingForm orderId={o.id} target="klijent" />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
