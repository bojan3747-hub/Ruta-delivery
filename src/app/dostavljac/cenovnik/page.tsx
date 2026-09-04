import { getCurrentUser } from "@/lib/auth";
import { getCourierById, getCourierZones } from "@/lib/queries/couriers";
import { PricingForm } from "@/components/PricingForm";

export default async function CenovnikPage() {
  const user = await getCurrentUser();
  if (!user?.courierId) return null;

  const [courier, zones] = await Promise.all([
    getCourierById(user.courierId),
    getCourierZones(user.courierId),
  ]);
  if (!courier) return null;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Cenovnik i zone pokrivenosti</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Ovaj cenovnik se koristi za automatski izračunate ponude na
          standardnim pošiljkama. Sačuvane vrednosti odmah važe za nove
          zahteve.
        </p>
      </div>
      <PricingForm
        defaults={{
          cenaPoKm: courier.cena_po_km,
          cenaPoKg: courier.cena_po_kg,
          minimalnaCena: courier.minimalna_cena,
          dnevniKapacitet: courier.dnevni_kapacitet,
          zones,
        }}
      />
    </div>
  );
}
