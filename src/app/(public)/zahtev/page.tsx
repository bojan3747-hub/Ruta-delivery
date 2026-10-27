import { createGuestShipmentAction } from "@/lib/actions/shipment-actions";
import { ShipmentForm } from "@/components/ShipmentForm";

// Faza 24: javna, neautentifikovana forma za zahtev dostave — "gost
// zahtev, nalog u pozadini" (KAN: olakšati registraciju za korisnike koji
// traže uslugu, dok dostavljači ostaju obavezno registrovani). Reuse
// ShipmentForm u mode="guest" (dodaje ime/telefon + saglasnost na vrhu,
// bez svega ostalog iz standardne forme), akcija kreira nalog u pozadini
// i vraća na /pracenje/[token].
export default function ZahtevPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-neutral-900">
          Zatražite dostavu
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Bez registracije — popunite podatke o pošiljci, a ponude
          dostavljača stižu na link koji dobijete odmah nakon slanja.
          Sačuvajte taj link: to je jedini način da pratite ovu pošiljku.
        </p>
      </div>
      <ShipmentForm mode="guest" action={createGuestShipmentAction} />
    </div>
  );
}
