import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listShipmentsByClient } from "@/lib/queries/shipments";
import { ZONE_LABELS } from "@/lib/zones";
import { SHIPMENT_STATUS_LABELS, SHIPMENT_TYPE_LABELS } from "@/lib/labels";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { PackageIcon, TruckIcon, CheckCircleIcon, XCircleIcon } from "@/components/icons";
import type { ShipmentStatus } from "@/lib/types";

const FILTERS: { value: ShipmentStatus | "SVE"; label: string }[] = [
  { value: "SVE", label: "Sve" },
  ...(Object.keys(SHIPMENT_STATUS_LABELS) as ShipmentStatus[]).map(
    (status) => ({ value: status, label: SHIPMENT_STATUS_LABELS[status] })
  ),
];

export default async function KlijentPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const user = await getCurrentUser();
  const allShipments = user?.companyId
    ? await listShipmentsByClient(user.companyId)
    : [];
  const activeFilter =
    status && status in SHIPMENT_STATUS_LABELS
      ? (status as ShipmentStatus)
      : "SVE";
  const shipments =
    activeFilter === "SVE"
      ? allShipments
      : allShipments.filter((s) => s.status === activeFilter);

  const brojUToku = allShipments.filter((s) =>
    ["OTVORENA", "PONUDE_STIGLE", "IZABRANA"].includes(s.status)
  ).length;
  const brojZavrsenih = allShipments.filter((s) => s.status === "ZAVRSENA").length;
  const brojOtkazanih = allShipments.filter((s) => s.status === "OTKAZANA").length;

  return (
    <div className="space-y-6">
      {allShipments.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={PackageIcon} value={allShipments.length} label="Ukupno pošiljki" accent="slate" />
          <StatCard icon={TruckIcon} value={brojUToku} label="U toku" accent="blue" />
          <StatCard icon={CheckCircleIcon} value={brojZavrsenih} label="Završeno" accent="emerald" />
          <StatCard icon={XCircleIcon} value={brojOtkazanih} label="Otkazano" accent="amber" />
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-serif text-2xl font-semibold text-neutral-900">Moje pošiljke</h1>
        <div className="flex flex-wrap items-center gap-3">
          {allShipments.length > 0 && (
            <a
              href={
                activeFilter === "SVE"
                  ? "/api/klijent/izvoz"
                  : `/api/klijent/izvoz?status=${activeFilter}`
              }
              className="text-sm text-emerald-600 hover:underline"
            >
              Izvezi u Excel
            </a>
          )}
          <Link
            href="/klijent/adrese"
            className="text-sm text-emerald-600 hover:underline"
          >
            Sačuvane adrese
          </Link>
          <Link
            href="/klijent/ocene"
            className="text-sm text-emerald-600 hover:underline"
          >
            Ocene o meni
          </Link>
          <Link
            href="/klijent/nova-posiljka"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            + Nova pošiljka
          </Link>
        </div>
      </div>

      {allShipments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={f.value === "SVE" ? "/klijent" : `/klijent?status=${f.value}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                activeFilter === f.value
                  ? "bg-emerald-600 text-white"
                  : "bg-black/5 text-neutral-700 hover:bg-black/10"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      )}

      {allShipments.length === 0 ? (
        <p className="rounded-lg border border-dashed border-black/15 p-8 text-center text-neutral-500">
          Nemate još nijednu pošiljku. Kliknite &ldquo;Nova pošiljka&rdquo; da
          unesete prvu.
        </p>
      ) : shipments.length === 0 ? (
        <p className="rounded-lg border border-dashed border-black/15 p-8 text-center text-neutral-500">
          Nema pošiljki sa ovim statusom.
        </p>
      ) : (
        <ul className="divide-y divide-black/10 rounded-xl border border-black/10 bg-white">
          {shipments.map((s) => (
            <li key={s.id}>
              <Link
                href={`/klijent/posiljke/${s.id}`}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-black/[0.02]"
              >
                <div>
                  <p className="font-medium">
                    {ZONE_LABELS[s.zona_preuzimanja]} → {ZONE_LABELS[s.zona_isporuke]}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {SHIPMENT_TYPE_LABELS[s.tip]}
                    {s.hitno ? " · Hitno" : ""}
                    {s.nestandardna ? " · Nestandardna" : ""} ·{" "}
                    {new Date(s.created_at).toLocaleDateString("sr-RS")}
                  </p>
                </div>
                <StatusBadge
                  status={s.status}
                  label={SHIPMENT_STATUS_LABELS[s.status]}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
