import Link from "next/link";
import { listAllOrdersForOperator } from "@/lib/queries/orders";
import { ZONE_LABELS } from "@/lib/zones";
import { ORDER_STATUS_LABELS, formatMoney, formatDateTime } from "@/lib/labels";
import { StatusBadge } from "@/components/StatusBadge";
import { AutoRefresh } from "@/components/AutoRefresh";
import type { OrderStatus } from "@/lib/types";

// Faza 9: NA_ISPORUCI je izbačen iz filtera — ostao je u ORDER_STATUS_LABELS
// samo kao stari/spojeni status (isti tekst kao U_TRANZITU), pa bi inače
// pravio duplikat "Preuzeo ponudu" stavke u padajućem meniju.
const FILTERS: { value: OrderStatus | "SVE"; label: string }[] = [
  { value: "SVE", label: "Sve" },
  ...(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[])
    .filter((status) => status !== "NA_ISPORUCI")
    .map((status) => ({
      value: status,
      label: ORDER_STATUS_LABELS[status],
    })),
];

export default async function OperaterPorudzbinePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const allOrders = await listAllOrdersForOperator();

  const activeFilter =
    status && status in ORDER_STATUS_LABELS ? (status as OrderStatus) : "SVE";
  const query = (q ?? "").trim().toLowerCase();

  const orders = allOrders.filter((o) => {
    if (activeFilter !== "SVE" && o.status !== activeFilter) return false;
    if (!query) return true;
    return (
      (o.client_naziv ?? "").toLowerCase().includes(query) ||
      o.courier_naziv.toLowerCase().includes(query) ||
      o.id.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={20000} />
      <div>
        <h1 className="text-2xl font-semibold">Porudžbine</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Pregled i pretraga svih porudžbina na platformi.
        </p>
      </div>

      <form className="flex flex-wrap gap-3">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Pretraži po klijentu, dostavljaču ili ID-u porudžbine"
          className="min-w-64 flex-1 rounded-md border border-black/15 px-3 py-2 text-sm"
        />
        {activeFilter !== "SVE" && (
          <input type="hidden" name="status" value={activeFilter} />
        )}
        <button
          type="submit"
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
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
                  ? `/operater/porudzbine?q=${encodeURIComponent(q)}`
                  : "/operater/porudzbine"
                : `/operater/porudzbine?status=${f.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`
            }
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              activeFilter === f.value
                ? "bg-emerald-700 text-white"
                : "bg-black/5 text-neutral-700 hover:bg-black/10"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="rounded-lg border border-dashed border-black/15 p-8 text-center text-neutral-500">
          Nema porudžbina koje odgovaraju pretrazi.
        </p>
      ) : (
        <ul className="divide-y divide-black/10 rounded-lg border border-black/10 bg-white">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/operater/porudzbine/${o.id}`}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-black/[0.02]"
              >
                <div>
                  <p className="font-medium">
                    {ZONE_LABELS[o.zona_preuzimanja]} → {ZONE_LABELS[o.zona_isporuke]}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {o.client_naziv} → {o.courier_naziv} · {formatMoney(o.cena)} ·{" "}
                    {formatDateTime(o.created_at)}
                  </p>
                </div>
                <StatusBadge status={o.status} label={ORDER_STATUS_LABELS[o.status]} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
