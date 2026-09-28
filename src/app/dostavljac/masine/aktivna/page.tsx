import { getCurrentUser } from "@/lib/auth";
import {
  listActiveMachineRequestsForCourier,
  listCompletedMachineRequestsForCourier,
} from "@/lib/queries/machine-requests";
import { ZONE_LABELS } from "@/lib/zones";
import { MACHINE_REQUEST_STATUS_LABELS, MACHINE_TYPE_LABELS, formatMoney } from "@/lib/labels";
import { StatusBadge } from "@/components/StatusBadge";
import { AdvanceMachineRequestButton } from "@/components/AdvanceMachineRequestButton";
import { CancelAcceptedMachineRequestButton } from "@/components/CancelAcceptedMachineRequestButton";
import { AutoRefresh } from "@/components/AutoRefresh";

export default async function AktivnaAngazovanjaPage() {
  const user = await getCurrentUser();
  const [active, completed] = user?.courierId
    ? await Promise.all([
        listActiveMachineRequestsForCourier(user.courierId),
        listCompletedMachineRequestsForCourier(user.courierId),
      ])
    : [[], []];

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={20000} />
      <h1 className="font-serif text-2xl font-semibold text-neutral-900">
        Aktivna angažovanja
      </h1>

      {active.length === 0 ? (
        <p className="rounded-lg border border-dashed border-black/15 p-8 text-center text-neutral-500">
          Nemate aktivnih angažovanja mašina.
        </p>
      ) : (
        <ul className="space-y-4">
          {active.map((r) => (
            <li key={r.id} className="rounded-xl border border-black/10 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{MACHINE_TYPE_LABELS[r.tip_masine]}</p>
                  <p className="text-sm text-neutral-500">Klijent: {r.client_naziv}</p>
                  <p className="text-sm text-neutral-500">
                    {ZONE_LABELS[r.zona]} · {r.adresa}
                  </p>
                  {r.cena && (
                    <p className="text-sm text-neutral-500">
                      Dogovorena cena: {formatMoney(r.cena)}
                    </p>
                  )}
                  <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">
                    {r.opis_posla}
                  </p>
                  {r.kontakt_ime && (
                    <p className="mt-1 text-sm text-neutral-500">
                      Kontakt: {r.kontakt_ime}
                      {r.kontakt_telefon ? ` · ${r.kontakt_telefon}` : ""}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={r.status} label={MACHINE_REQUEST_STATUS_LABELS[r.status]} />
                  <AdvanceMachineRequestButton requestId={r.id} status={r.status} />
                  <CancelAcceptedMachineRequestButton requestId={r.id} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {completed.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Nedavno završena</h2>
          <ul className="space-y-3">
            {completed.map((r) => (
              <li key={r.id} className="rounded-xl border border-black/10 bg-white p-4 text-sm">
                <p className="font-medium">{MACHINE_TYPE_LABELS[r.tip_masine]}</p>
                <p className="text-neutral-500">
                  Klijent: {r.client_naziv} · {ZONE_LABELS[r.zona]} · {r.adresa}
                  {r.cena ? ` · ${formatMoney(r.cena)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
