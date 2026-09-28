import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listMachineRequestsByClient } from "@/lib/queries/machine-requests";
import { ZONE_LABELS } from "@/lib/zones";
import { MACHINE_REQUEST_STATUS_LABELS, MACHINE_TYPE_LABELS, formatDateTime } from "@/lib/labels";
import { StatusBadge } from "@/components/StatusBadge";
import { CancelMachineRequestButton } from "@/components/CancelMachineRequestButton";

export default async function KlijentMasinePage() {
  const user = await getCurrentUser();
  const requests = user?.companyId
    ? await listMachineRequestsByClient(user.companyId)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-neutral-900">
            Angažovanje mašina
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Manje građevinske mašine sa rukovaocem — mini bager, valjak,
            dizalica i slično. Opišite posao, izvođač šalje ponudu sa cenom i
            procenom trajanja.
          </p>
        </div>
        <Link
          href="/klijent/masine/novo"
          className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + Novo angažovanje
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-xl border border-black/10 bg-white p-6 text-center text-sm text-neutral-600">
          Još nemate zahteva za angažovanje mašine.
        </div>
      ) : (
        <ul className="divide-y divide-black/10 rounded-xl border border-black/10 bg-white">
          {requests.map((r) => (
            <li key={r.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{MACHINE_TYPE_LABELS[r.tip_masine]}</p>
                  <p className="text-sm text-neutral-500">
                    {ZONE_LABELS[r.zona]} · {r.adresa} · {formatDateTime(r.created_at)}
                  </p>
                </div>
                <StatusBadge status={r.status} label={MACHINE_REQUEST_STATUS_LABELS[r.status]} />
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">
                {r.opis_posla}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <Link
                  href={`/klijent/masine/${r.id}`}
                  className="text-sm text-emerald-600 hover:underline"
                >
                  {/* Faza 19d: detalji (ponude / status / dogovorena cena) su na posebnoj strani. */}
                  Detalji {r.status === "OTVOREN" ? "i ponude" : ""} →
                </Link>
                {r.status === "OTVOREN" && (
                  <CancelMachineRequestButton requestId={r.id} />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
