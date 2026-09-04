import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getCourierById, getCourierZones } from "@/lib/queries/couriers";
import { listOpenManualRequestsForCourier } from "@/lib/queries/shipments";
import { listOrdersForCourier } from "@/lib/queries/orders";
import { ZONE_LABELS } from "@/lib/zones";
import { VEHICLE_TYPE_LABELS } from "@/lib/labels";

export default async function DostavljacPage() {
  const user = await getCurrentUser();
  const courier = user?.courierId ? await getCourierById(user.courierId) : null;
  if (!courier) return null;

  const [zones, requests, activeOrders] = await Promise.all([
    getCourierZones(courier.id),
    listOpenManualRequestsForCourier(courier.id),
    listOrdersForCourier(courier.id),
  ]);

  const cenovnikPodesen = courier.cena_po_km != null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Zdravo, {courier.naziv}</h1>

      {!cenovnikPodesen && (
        <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800 border border-amber-200">
          Cenovnik nije podešen — nećete dobijati automatske zahteve za
          standardne pošiljke dok ga ne unesete.{" "}
          <Link href="/dostavljac/cenovnik" className="underline font-medium">
            Podesi cenovnik
          </Link>
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <p className="text-2xl font-semibold">{activeOrders.length}</p>
          <p className="text-sm text-neutral-500">Aktivnih isporuka</p>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <p className="text-2xl font-semibold">{requests.length}</p>
          <p className="text-sm text-neutral-500">Otvorenih zahteva za ponudu</p>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <p className="text-2xl font-semibold">
            {courier.ocena_prosek ? Number(courier.ocena_prosek).toFixed(1) : "—"}
          </p>
          <p className="text-sm text-neutral-500">
            Prosečna ocena ({courier.broj_ocena})
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-4 text-sm">
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
