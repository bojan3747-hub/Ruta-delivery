import { notFound } from "next/navigation";
import Link from "next/link";
import { getMachineRequestDetailForOperator } from "@/lib/queries/machine-requests";
import { ZONE_LABELS } from "@/lib/zones";
import {
  MACHINE_REQUEST_STATUS_LABELS,
  MACHINE_TYPE_LABELS,
  formatDateTime,
  formatMoney,
} from "@/lib/labels";
import { StatusBadge } from "@/components/StatusBadge";
import { AutoRefresh } from "@/components/AutoRefresh";

export default async function OperaterMasinaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const request = await getMachineRequestDetailForOperator(id);
  if (!request) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <AutoRefresh intervalMs={20000} />
      <div>
        <Link href="/operater/masine" className="text-sm text-emerald-600 hover:underline">
          ← Nazad na angažovanja mašina
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-serif text-2xl font-semibold text-neutral-900">
            {MACHINE_TYPE_LABELS[request.tip_masine]}
          </h1>
          <StatusBadge status={request.status} label={MACHINE_REQUEST_STATUS_LABELS[request.status]} />
        </div>
        <p className="mt-1 text-sm text-neutral-500">{formatDateTime(request.created_at)}</p>
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-4 text-sm space-y-1">
        <p>
          <span className="text-neutral-500">Klijent:</span> {request.client_naziv}
        </p>
        <p>
          <span className="text-neutral-500">Izvođač:</span>{" "}
          {request.courier_naziv ?? "— (još nema prihvaćenu ponudu)"}
        </p>
        <p>
          <span className="text-neutral-500">Lokacija:</span>{" "}
          {ZONE_LABELS[request.zona]} · {request.adresa}
        </p>
        {request.zeljeni_termin && (
          <p>
            <span className="text-neutral-500">Željeni termin:</span>{" "}
            {request.zeljeni_termin}
          </p>
        )}
        {request.cena && (
          <p>
            <span className="text-neutral-500">Dogovorena cena:</span>{" "}
            {formatMoney(request.cena)}
          </p>
        )}
        {request.provizija && (
          <p>
            <span className="text-neutral-500">Provizija:</span>{" "}
            {formatMoney(request.provizija)}
          </p>
        )}
        {request.otkazano_razlog && (
          <p>
            <span className="text-neutral-500">Razlog otkazivanja:</span>{" "}
            {request.otkazano_razlog}
          </p>
        )}
      </div>

      <div className="rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-700">
        <p className="whitespace-pre-wrap">{request.opis_posla}</p>
        {request.napomena && (
          <p className="mt-2">
            <span className="text-neutral-500">Napomena:</span> {request.napomena}
          </p>
        )}
      </div>
    </div>
  );
}
