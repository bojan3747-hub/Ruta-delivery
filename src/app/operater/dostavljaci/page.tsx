import Link from "next/link";
import { listCouriersForOperator } from "@/lib/queries/couriers";
import { CreatePreApprovedCourierForm } from "@/components/CreatePreApprovedCourierForm";
import { BulkImportCouriersForm } from "@/components/BulkImportCouriersForm";
import { CourierStatusButton } from "@/components/CourierStatusButton";
import { StatusBadge } from "@/components/StatusBadge";
import { VEHICLE_TYPE_LABELS } from "@/lib/labels";

const STATUS_LABELS: Record<string, string> = {
  NA_POTVRDI: "Poziv poslat / na potvrdi",
  AKTIVAN: "Aktivan",
  SUSPENDOVAN: "Suspendovan",
};

export default async function DostavljaciPage() {
  const couriers = await listCouriersForOperator();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dostavljači</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Unesite prevoznika prikupljenog sa APR-a ili oglasa da kreirate
          pre-approved nalog. Dostavljač aktivira nalog preko linka i sam
          dopunjuje ostatak podataka.
        </p>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-5">
        <CreatePreApprovedCourierForm />
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-5">
        <BulkImportCouriersForm />
      </div>

      <ul className="divide-y divide-black/10 rounded-lg border border-black/10 bg-white">
        {couriers.map((c) => (
          <li key={c.id} className="px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{c.naziv}</p>
                <p className="text-sm text-neutral-500">
                  {c.telefon}
                  {c.izvor_kontakta ? ` · ${c.izvor_kontakta}` : ""}
                  {c.tip_vozila ? ` · ${VEHICLE_TYPE_LABELS[c.tip_vozila]}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={c.status} label={STATUS_LABELS[c.status]} />
                <CourierStatusButton courierId={c.id} status={c.status} />
              </div>
            </div>
            {c.status === "SUSPENDOVAN" && (
              <p className="mt-2 text-sm text-red-700">
                Suspendovan — ne dobija nove zahteve za ponude. Postojeće
                aktivne isporuke i dalje može da završi.
              </p>
            )}
            {c.status === "NA_POTVRDI" && (
              <p className="mt-2 text-sm">
                Link za aktivaciju:{" "}
                <Link
                  href={`/aktivacija/${c.aktivacioni_token}`}
                  className="text-emerald-700 hover:underline"
                >
                  /aktivacija/{c.aktivacioni_token}
                </Link>
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
