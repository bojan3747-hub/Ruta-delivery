import { getCurrentUser } from "@/lib/auth";
import {
  MANUAL_REQUEST_WINDOW_MINUTES,
  listOpenManualRequestsForCourier,
} from "@/lib/queries/shipments";
import { ZONE_LABELS } from "@/lib/zones";
import { SHIPMENT_TYPE_LABELS, TERMIN_LABELS, formatMoney } from "@/lib/labels";
import { ManualOfferForm } from "@/components/ManualOfferForm";
import { AutoRefresh } from "@/components/AutoRefresh";

function minutesLeft(createdAt: string): number {
  const deadline = new Date(createdAt).getTime() + MANUAL_REQUEST_WINDOW_MINUTES * 60_000;
  return Math.max(0, Math.round((deadline - Date.now()) / 60_000));
}

export default async function ZahteviPage() {
  const user = await getCurrentUser();
  const requests = user?.courierId
    ? await listOpenManualRequestsForCourier(user.courierId)
    : [];

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={20000} />
      <div>
        <h1 className="text-2xl font-semibold">Zahtevi za ponude</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Nestandardne pošiljke (palete, krhka roba, veće količine) u vašim
          zonama. Imate {MANUAL_REQUEST_WINDOW_MINUTES} minuta od prijema
          zahteva da pošaljete ponudu.
        </p>
      </div>

      {requests.length === 0 ? (
        <p className="rounded-lg border border-dashed border-black/15 p-8 text-center text-neutral-500">
          Trenutno nema otvorenih zahteva u vašim zonama.
        </p>
      ) : (
        <ul className="space-y-4">
          {requests.map((s) => (
            <li key={s.id} className="rounded-lg border border-black/10 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {ZONE_LABELS[s.zona_preuzimanja]} → {ZONE_LABELS[s.zona_isporuke]}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {SHIPMENT_TYPE_LABELS[s.tip]} · {TERMIN_LABELS[s.zeljeni_termin]}
                    {s.termin_detalji ? ` (${s.termin_detalji})` : ""}
                    {s.hitno ? " · Hitno" : ""}
                  </p>
                  {s.deklarisana_vrednost && (
                    <p className="mt-1 text-sm text-neutral-500">
                      Deklarisana vrednost: {formatMoney(s.deklarisana_vrednost)}
                    </p>
                  )}
                  {s.napomena && (
                    <p className="mt-1 text-sm text-neutral-700">{s.napomena}</p>
                  )}
                </div>
                <span className="whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                  još ~{minutesLeft(s.created_at)} min
                </span>
              </div>
              <div className="mt-4 border-t border-black/10 pt-4">
                <ManualOfferForm shipmentId={s.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
