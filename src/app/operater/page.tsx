import { listCouriersForOperator } from "@/lib/queries/couriers";
import { listAllOrdersForOperator } from "@/lib/queries/orders";
import { formatMoney } from "@/lib/labels";
import { StatCard } from "@/components/StatCard";
import { TruckIcon, ClipboardListIcon, PackageIcon, PercentIcon } from "@/components/icons";

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
      <h1 className="font-serif text-2xl font-semibold text-neutral-900">Pregled platforme</h1>
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard icon={TruckIcon} value={aktivni} label="Aktivnih dostavljača" accent="blue" />
        <StatCard icon={ClipboardListIcon} value={naPotvrdi} label="Čeka aktivaciju" accent="amber" />
        <StatCard icon={PackageIcon} value={orders.length} label="Ukupno porudžbina" accent="slate" />
        <StatCard
          icon={PercentIcon}
          value={formatMoney(ukupnaProvizija)}
          label="Ukupna provizija"
          accent="emerald"
        />
      </div>
    </div>
  );
}
