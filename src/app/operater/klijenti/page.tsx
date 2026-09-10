import { listCompaniesForOperator } from "@/lib/queries/companies";
import { formatDateTime } from "@/lib/labels";

export default async function OperaterKlijentiPage() {
  const companies = await listCompaniesForOperator();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Klijenti</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Svi registrovani klijenti, sa podacima koje su uneli prilikom
            registracije.
          </p>
        </div>
        <a
          href="/api/operater/izvoz-klijenata"
          className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5"
        >
          Izvezi u Excel
        </a>
      </div>

      {companies.length === 0 ? (
        <p className="rounded-lg border border-dashed border-black/15 p-8 text-center text-neutral-500">
          Još nema registrovanih klijenata.
        </p>
      ) : (
        <ul className="divide-y divide-black/10 rounded-lg border border-black/10 bg-white">
          {companies.map((c) => (
            <li key={c.id} className="px-4 py-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{c.naziv}</p>
                  <p className="mt-0.5 text-neutral-500">
                    {c.pib ? `PIB: ${c.pib}` : "PIB: —"}
                    {c.adresa ? ` · ${c.adresa}` : ""}
                  </p>
                  <p className="mt-0.5 text-neutral-500">
                    Kontakt: {c.kontakt_ime}
                    {c.kontakt_telefon ? ` · ${c.kontakt_telefon}` : ""} ·{" "}
                    {c.kontakt_email}
                  </p>
                  {c.ocena_prosek && (
                    <p className="mt-0.5 text-neutral-500">
                      Ocena: ★ {Number(c.ocena_prosek).toFixed(1)} ({c.broj_ocena})
                    </p>
                  )}
                </div>
                <p className="whitespace-nowrap text-xs text-neutral-400">
                  Registrovan: {formatDateTime(c.created_at)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
