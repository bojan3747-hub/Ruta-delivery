import { getCurrentUser } from "@/lib/auth";
import { listSavedAddresses } from "@/lib/queries/saved-addresses";
import { ShipmentForm } from "@/components/ShipmentForm";

export default async function NovaPosiljkaPage() {
  const user = await getCurrentUser();
  const savedAddresses = user?.companyId
    ? await listSavedAddresses(user.companyId)
    : [];

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nova pošiljka</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Za standardne pošiljke ponude aktivnih dostavljača stižu automatski,
          u roku od nekoliko sekundi. Za nestandardne pošiljke (palete, krhka
          roba, veće količine) dostavljači šalju ponudu ručno, u roku od 15
          minuta.
        </p>
      </div>
      <ShipmentForm savedAddresses={savedAddresses} />
    </div>
  );
}
