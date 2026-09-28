import Link from "next/link";
import { getCommissionSetting } from "@/lib/queries/commission";
import { listAllMachineRequestsForOperator } from "@/lib/queries/machine-requests";
import { ZONE_LABELS } from "@/lib/zones";
import { MACHINE_REQUEST_STATUS_LABELS, MACHINE_TYPE_LABELS, formatMoney, formatDateTime } from "@/lib/labels";
import { StatusBadge } from "@/components/StatusBadge";
import { AutoRefresh } from "@/components/AutoRefresh";
import { MachineCommissionForm } from "@/components/MachineCommissionForm";
import type { MachineRequestStatus } from "@/lib/types";

const FILTERS: { value: MachineRequestStatus | "SVE"; label: string }[] = [
  { value: "SVE", label: "Sve" },
  ...(Object.keys(MACHINE_REQUEST_STATUS_LABELS) as MachineRequestStatus[]).map(
    (status) => ({ value: status, label: MACHINE_REQUEST_STATUS_LABELS[status] })
  ),
];

export default async function OperaterMasinePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const [setting, allRequests] = await Promise.all([
    getCommissionSetting(),
    listAllMachineRequestsForOperator(),
  ]);

  const activeFilter =
    status && status in MACHINE_REQUEST_STATUS_LABELS
      ? (status as MachineRequestStatus)
      : "SVE";
  const query = (q ?? "").trim().toLowerCase();

  const requests = allRequests.filter((r) => {
    if (activeFilter !== "SVE" && r.status !== activeFilter) return false;
    if (!query) return true;
    return (
      r.client_naziv.toLowerCase().includes(query) ||
      (r.courier_naziv ?? "").toLowerCase().includes(query) ||
      r.id.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-8">
      <AutoRefresh intervalMs={20000} />
      <div>
        <h1 className="font-serif text-2xl font-semibold text-neutral-900">
          Angažovanja mašina
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Pregled i pretraga svih zahteva za angažovanje mašina na
          platformi. Procenat provizije za mašine je poseban od procenta za
          prevoz pošiljki.
        </p>
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-5">
        <MachineCommissionForm current={Number(setting.procenat_masine)} />
      </div>

      <form className="flex flex-wrap gap-3">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Pretraži po klijentu, izvođaču ili ID-u zahteva"
          className="min-w-64 flex-1 rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
        />
        {activeFilter !== "SVE" && (
          <input type="hidden" name="status" value={activeFilter} />
        )}
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Pretraži
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={
              f.value === "SVE"
                ? q
                  ? `/operater/masine?q=${encodeURIComponent(q)}`
                  : "/operater/masine"
                : `/operater/masine?status=${f.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`
            }
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

      {requests.length === 0 ? (
        <p className="rounded-lg border border-dashed border-black/15 p-8 text-center text-neutral-500">
          Nema zahteva koji odgovaraju pretrazi.
        </p>
      ) : (
        <ul className="divide-y divide-black/10 rounded-xl border border-black/10 bg-white">
          {requests.map((r) => (
            <li key={r.id}>
              <Link
                href={`/operater/masine/${r.id}`}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-black/[0.02]"
              >
                <div>
                  <p className="font-medium">{MACHINE_TYPE_LABELS[r.tip_masine]}</p>
                  <p className="text-sm text-neutral-500">
                    {r.client_naziv} → {r.courier_naziv ?? "—"} · {ZONE_LABELS[r.zona]} ·{" "}
                    {r.cena ? formatMoney(r.cena) : "bez cene"} · {formatDateTime(r.created_at)}
                  </p>
                </div>
                <StatusBadge status={r.status} label={MACHINE_REQUEST_STATUS_LABELS[r.status]} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
