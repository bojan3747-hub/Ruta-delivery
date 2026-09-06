import { getCurrentUser } from "@/lib/auth";
import { listCompletedOrdersForCourier, listOrdersForCourier } from "@/lib/queries/orders";
import { ZONE_LABELS } from "@/lib/zones";
import { ORDER_STATUS_LABELS, SHIPMENT_TYPE_LABELS, formatMoney } from "@/lib/labels";
import { StatusBadge } from "@/components/StatusBadge";
import { AdvanceOrderButton } from "@/components/AdvanceOrderButton";
import { CancelOrderButton } from "@/components/CancelOrderButton";

export default async function AktivneIsporukePage() {
  const user = await getCurrentUser();
  const [orders, completed] = user?.courierId
    ? await Promise.all([
        listOrdersForCourier(user.courierId),
        listCompletedOrdersForCourier(user.courierId),
      ])
    : [[], []];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Aktivne isporuke</h1>

      {orders.length === 0 ? (
        <p className="rounded-lg border border-dashed border-black/15 p-8 text-center text-neutral-500">
          Nemate aktivnih isporuka.
        </p>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o.id} className="rounded-lg border border-black/10 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {ZONE_LABELS[o.zona_preuzimanja]} → {ZONE_LABELS[o.zona_isporuke]}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {o.adresa_preuzimanja} → {o.adresa_isporuke}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {SHIPMENT_TYPE_LABELS[o.tip]} · {formatMoney(o.cena)}
                  </p>
                  {o.client_telefon && (
                    <p className="mt-1 text-sm text-neutral-500">
                      Kontakt: {o.client_kontakt_ime} · {o.client_telefon}
                    </p>
                  )}
                  {o.deklarisana_vrednost && (
                    <p className="mt-1 text-sm text-neutral-500">
                      Odgovarate za pošiljku do: {formatMoney(o.deklarisana_vrednost)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={o.status} label={ORDER_STATUS_LABELS[o.status]} />
                  <AdvanceOrderButton orderId={o.id} status={o.status} />
                  <CancelOrderButton orderId={o.id} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {completed.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Nedavno završene</h2>
          <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Ruta</th>
                  <th className="px-4 py-2 font-medium">Cena</th>
                  <th className="px-4 py-2 font-medium">Provizija platforme</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {completed.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-2">
                      {ZONE_LABELS[o.zona_preuzimanja]} → {ZONE_LABELS[o.zona_isporuke]}
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
        </div>
      )}
    </div>
  );
}
