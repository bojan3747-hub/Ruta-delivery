import { notFound } from "next/navigation";
import { getCourierByToken } from "@/lib/queries/couriers";
import { ActivateCourierForm } from "@/components/ActivateCourierForm";

export default async function AktivacijaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const courier = await getCourierByToken(token);
  if (!courier) notFound();

  if (courier.status === "AKTIVAN") {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Nalog je već aktiviran</h1>
        <p className="text-neutral-600">
          Nalog za &ldquo;{courier.naziv}&rdquo; je već aktivan. Prijavite se
          svojim emailom i lozinkom.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Aktivacija naloga — {courier.naziv}</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Ruta-Dostava vas je kontaktirala i pripremila nalog na osnovu vaših
          osnovnih podataka. Dopunite podatke ispod da počnete da primate
          zahteve za dostavu.
        </p>
      </div>
      <ActivateCourierForm token={token} telefon={courier.telefon} />
    </div>
  );
}
