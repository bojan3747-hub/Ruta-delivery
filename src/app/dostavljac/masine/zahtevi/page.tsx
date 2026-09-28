import { getCurrentUser } from "@/lib/auth";
import { listOpenMachineRequestsForCourier } from "@/lib/queries/machine-requests";
import { getCourierMachines } from "@/lib/queries/machines";
import { ZONE_LABELS } from "@/lib/zones";
import { MACHINE_TYPE_LABELS, formatDateTime } from "@/lib/labels";
import { ManualMachineOfferForm } from "@/components/ManualMachineOfferForm";
import { AutoRefresh } from "@/components/AutoRefresh";

export default async function ZahteviMasinaPage() {
  const user = await getCurrentUser();
  const [requests, machines] = user?.courierId
    ? await Promise.all([
        listOpenMachineRequestsForCourier(user.courierId),
        getCourierMachines(user.courierId),
      ])
    : [[], []];

  const cenaBySatu = new Map(
    machines.map((m) => [m.tip_masine, m.cena_po_satu ? Number(m.cena_po_satu) : undefined])
  );

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={20000} />
      <div>
        <h1 className="font-serif text-2xl font-semibold text-neutral-900">
          Zahtevi za mašine
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Otvoreni zahtevi za angažovanje u vašim zonama, za mašine koje ste
          podesili u profilu (Moje mašine). Nema fiksne cene — pošaljite
          ponudu sa svojom procenom cene i trajanja.
        </p>
      </div>

      {requests.length === 0 ? (
        <p className="rounded-lg border border-dashed border-black/15 p-8 text-center text-neutral-500">
          Trenutno nema otvorenih zahteva za mašine koje nudite u vašim
          zonama.
        </p>
      ) : (
        <ul className="space-y-4">
          {requests.map((r) => (
            <li key={r.id} className="rounded-xl border border-black/10 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{MACHINE_TYPE_LABELS[r.tip_masine]}</p>
                  <p className="text-sm text-neutral-500">Klijent: {r.client_naziv}</p>
                  <p className="text-sm text-neutral-500">
                    {ZONE_LABELS[r.zona]} · {r.adresa} · {formatDateTime(r.created_at)}
                  </p>
                  {r.zeljeni_termin && (
                    <p className="mt-0.5 text-sm font-medium text-neutral-800">
                      Željeni termin: {r.zeljeni_termin}
                    </p>
                  )}
                  <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">
                    {r.opis_posla}
                  </p>
                  {r.napomena && (
                    <p className="mt-1 text-sm text-neutral-500">
                      Napomena: {r.napomena}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 border-t border-black/10 pt-4">
                <ManualMachineOfferForm
                  machineRequestId={r.id}
                  defaultCena={cenaBySatu.get(r.tip_masine)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
