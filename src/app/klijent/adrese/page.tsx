import { getCurrentUser } from "@/lib/auth";
import { listSavedAddresses } from "@/lib/queries/saved-addresses";
import { ZONE_LABELS } from "@/lib/zones";
import { SavedAddressForm } from "@/components/SavedAddressForm";
import { DeleteSavedAddressButton } from "@/components/DeleteSavedAddressButton";

export default async function AdresarPage() {
  const user = await getCurrentUser();
  const addresses = user?.companyId ? await listSavedAddresses(user.companyId) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Sačuvane adrese</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Sačuvajte adrese koje često koristite (npr. sedište firme) da ih ne
          kucate iznova pri svakoj novoj pošiljci.
        </p>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-5">
        <SavedAddressForm />
      </div>

      {addresses.length === 0 ? (
        <p className="rounded-lg border border-dashed border-black/15 p-8 text-center text-neutral-500">
          Još nemate sačuvanih adresa.
        </p>
      ) : (
        <ul className="divide-y divide-black/10 rounded-lg border border-black/10 bg-white">
          {addresses.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <p className="font-medium">{a.naziv}</p>
                <p className="text-sm text-neutral-500">
                  {a.adresa} · {ZONE_LABELS[a.zona]}
                </p>
              </div>
              <DeleteSavedAddressButton addressId={a.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
