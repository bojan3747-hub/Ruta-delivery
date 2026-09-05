import { getCommissionSetting } from "@/lib/queries/commission";
import { listAllOrdersForOperator } from "@/lib/queries/orders";
import { listAllInvoicesForOperator } from "@/lib/queries/invoices";
import {
  ORDER_STATUS_LABELS,
  INVOICE_STATUS_LABELS,
  formatMoney,
  formatDateTime,
  formatMonth,
} from "@/lib/labels";
import { StatusBadge } from "@/components/StatusBadge";
import { CommissionForm } from "@/components/CommissionForm";
import { GenerateInvoicesForm } from "@/components/GenerateInvoicesForm";
import { MarkInvoicePaidButton } from "@/components/MarkInvoicePaidButton";

export default async function ProvizijaPage() {
  const [setting, orders, invoices] = await Promise.all([
    getCommissionSetting(),
    listAllOrdersForOperator(),
    listAllInvoicesForOperator(),
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

      <div className="space-y-3">
        <div>
          <h2 className="font-semibold">Mesečne fakture dostavljača</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Generiše po jednu fakturu po dostavljaču, za zbir provizije od
            svih isporuka u izabranom mesecu. Naplata kartice (AllSecure) je
            zasebna faza — za sada se ovde ručno prati status.
          </p>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-5">
          <GenerateInvoicesForm />
        </div>

        {invoices.length === 0 ? (
          <p className="rounded-lg border border-dashed border-black/15 p-8 text-center text-neutral-500">
            Još nema generisanih faktura.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Mesec</th>
                  <th className="px-4 py-2 font-medium">Dostavljač</th>
                  <th className="px-4 py-2 font-medium">Iznos</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-2 capitalize">{formatMonth(inv.period_start)}</td>
                    <td className="px-4 py-2">{inv.courier_naziv}</td>
                    <td className="px-4 py-2">{formatMoney(inv.iznos)}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={inv.status} label={INVOICE_STATUS_LABELS[inv.status]} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      {inv.status === "NEPLACENO" && (
                        <MarkInvoicePaidButton invoiceId={inv.id} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
