import { getCurrentUser } from "@/lib/auth";
import { getCourierById } from "@/lib/queries/couriers";
import { listInvoicesForCourier } from "@/lib/queries/invoices";
import { INVOICE_STATUS_LABELS, formatMoney, formatMonth } from "@/lib/labels";
import { StatusBadge } from "@/components/StatusBadge";

export default async function FakturePage() {
  const user = await getCurrentUser();
  const courier = user?.courierId ? await getCourierById(user.courierId) : null;
  if (!courier) return null;

  const invoices = await listInvoicesForCourier(courier.id);
  const karticaRegistrovana = Boolean(courier.payu_customer_token);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Fakture</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Mesečna faktura za proviziju platforme, obračunata na isporuke
          završene tog meseca.
        </p>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-4 text-sm">
        {karticaRegistrovana ? (
          <p>
            <span className="text-neutral-500">Način naplate:</span> kartica na
            dosijeu (registrovana).
          </p>
        ) : (
          <p className="text-neutral-600">
            Naplata karticom još nije podešena — trenutno se fakture prate
            ručno, dok se ne uključi automatska naplata.
          </p>
        )}
      </div>

      {invoices.length === 0 ? (
        <p className="rounded-lg border border-dashed border-black/15 p-8 text-center text-neutral-500">
          Još nema faktura.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">Mesec</th>
                <th className="px-4 py-2 font-medium">Iznos</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-4 py-2 capitalize">{formatMonth(inv.period_start)}</td>
                  <td className="px-4 py-2">{formatMoney(inv.iznos)}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={inv.status} label={INVOICE_STATUS_LABELS[inv.status]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
