import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getCourierById, getCourierZones } from "@/lib/queries/couriers";
import { listOpenRequestsForCourier } from "@/lib/queries/shipments";
import { listOrdersForCourier } from "@/lib/queries/orders";
import { ZONE_LABELS } from "@/lib/zones";
import { VEHICLE_TYPE_LABELS } from "@/lib/labels";
import { CourierAvailabilityToggle } from "@/components/CourierAvailabilityToggle";
import { StatCard } from "@/components/StatCard";
import { TruckIcon, ClipboardListIcon, StarIcon } from "@/components/icons";

export default async function DostavljacPage() {
  const user = await getCurrentUser();
  const courier = user?.courierId ? await getCourierById(user.courierId) : null;
  if (!courier) return null;

  const [zones, requests, activeOrders] = await Promise.all([
    getCourierZones(courier.id),
    listOpenRequestsForCourier(courier.id),
    listOrdersForCourier(courier.id),
  ]);

  const cenovnikPodesen = courier.cena_po_km != null;

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-semibold text-neutral-900">Zdravo, {courier.naziv}</h1>

      {courier.status === "SUSPENDOVAN" && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 border border-red-200">
          Vaš nalog je suspendovan od strane operatera — ne dobijate nove
          zahteve za ponude. Postojeće aktivne isporuke možete da završite
          normalno. Za više informacija kontaktirajte operatera.
        </p>
      )}

      {courier.status === "AKTIVAN" && (
        <CourierAvailabilityToggle dostupan={courier.dostupan} />
      )}

      {!cenovnikPodesen && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 border border-amber-200">
          Cenovnik nije podešen — nećete dobijati automatske zahteve za
          standardne pošiljke dok ga ne unesete.{" "}
          <Link href="/dostavljac/cenovnik" className="underline font-medium">
            Podesi cenovnik
          </Link>
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={TruckIcon} value={activeOrders.length} label="Aktivnih isporuka" accent="blue" />
        <StatCard icon={ClipboardListIcon} value={requests.length} label="Otvorenih zahteva za ponudu" accent="amber" />
        <StatCard
          icon={StarIcon}
          value={courier.ocena_prosek ? Number(courier.ocena_prosek).toFixed(1) : "—"}
          label={`Prosečna ocena (${courier.broj_ocena})`}
          accent="emerald"
        />
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-4 text-sm">
        <p>
          <span className="text-neutral-500">Vozilo:</span>{" "}
          {courier.tip_vozila ? VEHICLE_TYPE_LABELS[courier.tip_vozila] : "—"}
        </p>
        <p className="mt-1">
          <span className="text-neutral-500">Zone pokrivenosti:</span>{" "}
          {zones.length > 0 ? zones.map((z) => ZONE_LABELS[z]).join(", ") : "—"}
        </p>
        <p className="mt-1">
          <span className="text-neutral-500">Dnevni kapacitet:</span>{" "}
          {courier.dnevni_kapacitet}
        </p>
      </div>
    </div>
  );
}
