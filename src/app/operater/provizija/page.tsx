import { getCommissionSetting } from "@/lib/queries/commission";
import { listAllOrdersForOperator } from "@/lib/queries/orders";
import { ORDER_STATUS_LABELS, formatMoney, formatDateTime } from "@/lib/labels";
import { StatusBadge } from "@/components/StatusBadge";
import { CommissionForm } from "@/components/CommissionForm";

export default async function ProvizijaPage() {
  const [setting, orders] = await Promise.all([
    getCommissionSetting(),
    listAllOrdersForOperator(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Provizija</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Procenat se primenjuje na svaku porudžbinu u trenutku kada pređe u
          status &ldquo;Isporučeno&rdquo;.
        </p>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-5">
        <CommissionForm current={Number(setting.procenat)} />
      </div>

      <div>
        <h2 className="mb-3 font-semibold">Porudžbine</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-neutral-500">Još nema porudžbina.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Datum</th>
                  <th className="px-4 py-2 font-medium">Klijent</th>
                  <th className="px-4 py-2 font-medium">Dostavljač</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Cena</th>
                  <th className="px-4 py-2 font-medium">Provizija</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-2 text-neutral-500">
                      {formatDateTime(o.created_at)}
                    </td>
                    <td className="px-4 py-2">{o.client_naziv}</td>
                    <td className="px-4 py-2">{o.courier_naziv}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={o.status} label={ORDER_STATUS_LABELS[o.status]} />
                    </td>
                    <td className="px-4 py-2">{formatMoney(o.cena)}</td>
                    <td className="px-4 py-2">
                      {o.provizija ? formatMoney(o.provizija) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
