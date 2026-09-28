import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getMachineRequestById } from "@/lib/queries/machine-requests";
import { listOffersForMachineRequest } from "@/lib/queries/machine-offers";
import { getCourierById } from "@/lib/queries/couriers";
import { ZONE_LABELS } from "@/lib/zones";
import {
  MACHINE_REQUEST_STATUS_LABELS,
  MACHINE_REQUEST_STATUS_STEPS,
  MACHINE_TYPE_LABELS,
  formatDateTime,
  formatMoney,
} from "@/lib/labels";
import type { MachineRequestStatus } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { CancelMachineRequestButton } from "@/components/CancelMachineRequestButton";
import { CancelAcceptedMachineRequestButton } from "@/components/CancelAcceptedMachineRequestButton";
import { AcceptMachineOfferButton } from "@/components/AcceptMachineOfferButton";
import { AutoRefresh } from "@/components/AutoRefresh";

export default async function MachineRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const request = await getMachineRequestById(id);

  if (!request || !user?.companyId || request.client_id !== user.companyId) {
    notFound();
  }

  const offers = request.status === "OTVOREN" ? await listOffersForMachineRequest(id) : [];
  const courier = request.courier_id ? await getCourierById(request.courier_id) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <AutoRefresh intervalMs={20000} />
      <div>
        <h1 className="font-serif text-2xl font-semibold text-neutral-900">
          {MACHINE_TYPE_LABELS[request.tip_masine]}
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          {ZONE_LABELS[request.zona]} · {request.adresa}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={request.status} label={MACHINE_REQUEST_STATUS_LABELS[request.status]} />
        <span className="text-sm text-neutral-500">
          Poslato {formatDateTime(request.created_at)}
        </span>
      </div>

      <div className="rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-700">
        <p className="whitespace-pre-wrap">{request.opis_posla}</p>
        {request.zeljeni_termin && (
          <p className="mt-2">
            <span className="text-neutral-500">Željeni termin:</span>{" "}
            {request.zeljeni_termin}
          </p>
        )}
        {request.napomena && (
          <p className="mt-2">
            <span className="text-neutral-500">Napomena:</span> {request.napomena}
          </p>
        )}
      </div>

      {request.status === "OTVOREN" && (
        <>
          <CancelMachineRequestButton requestId={request.id} />

          <section className="space-y-3">
            <h2 className="font-semibold">Ponude</h2>
            {offers.length === 0 ? (
              <p className="rounded-lg border border-dashed border-black/15 p-6 text-center text-sm text-neutral-500">
                Čekamo da neki od izvođača u vašoj zoni pošalje ponudu.
              </p>
            ) : (
              <ul className="divide-y divide-black/10 rounded-xl border border-black/10 bg-white">
                {offers.map((o) => (
                  <li
                    key={o.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <div>
                      <p className="flex items-center gap-1.5 font-medium">
                        {o.courier_naziv}
                        {o.courier_verifikovan && (
                          <span
                            title="Operater je proverio registraciju ovog izvođača"
                            className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800"
                          >
                            ✓ Verifikovan
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-neutral-500">
                        Procena trajanja: {o.procena_trajanja}
                        {o.courier_ocena_prosek
                          ? ` · ★ ${Number(o.courier_ocena_prosek).toFixed(1)}`
                          : ""}
                        {o.napomena ? ` · ${o.napomena}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">{formatMoney(o.cena)}</span>
                      <AcceptMachineOfferButton requestId={request.id} offerId={o.id} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {(request.status === "PRIHVACENO" || request.status === "NA_LOKACIJI" || request.status === "ZAVRSENO") && (
        <section className="space-y-4">
          <h2 className="font-semibold">Praćenje angažovanja</h2>
          <ol className="flex flex-wrap gap-2">
            {MACHINE_REQUEST_STATUS_STEPS.map((step) => {
              const currentIdx = MACHINE_REQUEST_STATUS_STEPS.indexOf(request.status);
              const reached = MACHINE_REQUEST_STATUS_STEPS.indexOf(step) <= currentIdx;
              const stepTimestamp: Partial<Record<MachineRequestStatus, string | null>> = {
                PRIHVACENO: request.updated_at,
                NA_LOKACIJI: request.na_lokaciji_at,
                ZAVRSENO: request.zavrseno_at,
              };
              const timestamp = reached ? stepTimestamp[step] : null;
              return (
                <li key={step} className="flex items-center gap-2">
                  <span className="flex flex-col items-center">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        reached ? "bg-emerald-600 text-white" : "bg-neutral-200 text-neutral-500"
                      }`}
                    >
                      {MACHINE_REQUEST_STATUS_LABELS[step]}
                    </span>
                    {timestamp && (
                      <span className="mt-1 text-[10px] text-neutral-400">
                        {formatDateTime(timestamp)}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>

          {courier && (
            <p className="text-sm text-neutral-600">
              Izvođač: {courier.naziv} · {courier.telefon}
            </p>
          )}
          {request.cena && (
            <p className="text-sm text-neutral-600">
              Dogovorena cena: {formatMoney(request.cena)}
            </p>
          )}

          {(request.status === "PRIHVACENO" || request.status === "NA_LOKACIJI") && (
            <CancelAcceptedMachineRequestButton requestId={request.id} />
          )}
        </section>
      )}

      {request.status === "OTKAZANO" && request.otkazano_razlog && (
        <p className="rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-700">
          Razlog otkazivanja: {request.otkazano_razlog}
        </p>
      )}
    </div>
  );
}
