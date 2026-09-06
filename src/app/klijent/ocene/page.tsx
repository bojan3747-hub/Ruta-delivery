import { getCurrentUser } from "@/lib/auth";
import { getCompanyById } from "@/lib/queries/companies";
import { listRatingsForCompany } from "@/lib/queries/ratings";
import { ZONE_LABELS } from "@/lib/zones";
import { formatDateTime } from "@/lib/labels";
import type { Zone } from "@/lib/types";

export default async function KlijentOcenePage() {
  const user = await getCurrentUser();
  const company = user?.companyId ? await getCompanyById(user.companyId) : null;

  if (!company) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Ocene o vama</h1>
        <p className="rounded-lg border border-dashed border-black/15 p-8 text-center text-neutral-500">
          Podaci o firmi nisu pronađeni. Pokušajte da se ponovo prijavite.
        </p>
      </div>
    );
  }

  const ratings = await listRatingsForCompany(company.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ocene o vama</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Ono što su dostavljači ostavili nakon isporuke. Prosečna ocena:{" "}
          {company.ocena_prosek ? `★ ${Number(company.ocena_prosek).toFixed(1)}` : "—"}{" "}
          ({company.broj_ocena})
        </p>
      </div>

      {ratings.length === 0 ? (
        <p className="rounded-lg border border-dashed border-black/15 p-8 text-center text-neutral-500">
          Još nema ocena.
        </p>
      ) : (
        <ul className="space-y-3">
          {ratings.map((r) => (
            <li key={r.id} className="rounded-lg border border-black/10 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{"★".repeat(r.ocena)}{"☆".repeat(5 - r.ocena)}</span>
                <span className="text-sm text-neutral-500">{formatDateTime(r.created_at)}</span>
              </div>
              <p className="mt-1 text-sm text-neutral-500">
                {ZONE_LABELS[r.zona_preuzimanja as Zone]} → {ZONE_LABELS[r.zona_isporuke as Zone]}
              </p>
              {r.komentar && <p className="mt-2 text-sm text-neutral-800">{r.komentar}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
