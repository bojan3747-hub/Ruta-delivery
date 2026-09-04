import { listCouriersForOperator } from "@/lib/queries/couriers";
import { listAllOrdersForOperator } from "@/lib/queries/orders";
import { formatMoney } from "@/lib/labels";

export default async function OperaterPage() {
  const [couriers, orders] = await Promise.all([
    listCouriersForOperator(),
    listAllOrdersForOperator(),
  ]);

  const aktivni = couriers.filter((c) => c.status === "AKTIVAN").length;
  const naPotvrdi = couriers.filter((c) => c.status === "NA_POTVRDI").length;
  const ukupnaProvizija = orders.reduce(
    (sum, o) => sum + (o.provizija ? Number(o.provizija) : 0),
    0
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Pregled platforme</h1>
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <p className="text-2xl font-semibold">{aktivni}</p>
          <p className="text-sm text-neutral-500">Aktivnih dostavljača</p>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <p className="text-2xl font-semibold">{naPotvrdi}</p>
          <p className="text-sm text-neutral-500">Čeka aktivaciju</p>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <p className="text-2xl font-semibold">{orders.length}</p>
          <p className="text-sm text-neutral-500">Ukupno porudžbina</p>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <p className="text-2xl font-semibold">{formatMoney(ukupnaProvizija)}</p>
          <p className="text-sm text-neutral-500">Ukupna provizija</p>
        </div>
      </div>
    </div>
  );
}
