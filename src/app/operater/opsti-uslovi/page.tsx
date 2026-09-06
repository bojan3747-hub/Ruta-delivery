import { listOpstiUsloviHistory } from "@/lib/queries/opsti-uslovi";
import { formatDateTime } from "@/lib/labels";
import { UploadOpstiUsloviForm } from "@/components/UploadOpstiUsloviForm";

export default async function OperaterOpstiUsloviPage() {
  const history = await listOpstiUsloviHistory();
  const current = history[0] ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Opšti uslovi korišćenja</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Klijenti i dostavljači ovaj dokument moraju da prihvate pri
          registraciji/aktivaciji naloga. Novi upload odmah postaje važeća
          verzija — stare verzije ostaju u istoriji ispod.
        </p>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-5">
        {current ? (
          <p className="mb-4 text-sm">
            <span className="text-neutral-500">Trenutno važi:</span>{" "}
            {current.naziv_fajla} ({formatDateTime(current.created_at)}) —{" "}
            <a
              href="/api/opsti-uslovi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 underline hover:text-emerald-800"
            >
              pregledaj
            </a>
          </p>
        ) : (
          <p className="mb-4 text-sm text-neutral-500">
            Nijedan dokument još nije postavljen.
          </p>
        )}
        <UploadOpstiUsloviForm />
      </div>

      {history.length > 1 && (
        <div>
          <h2 className="mb-3 font-semibold">Istorija verzija</h2>
          <ul className="divide-y divide-black/10 rounded-lg border border-black/10 bg-white">
            {history.slice(1).map((doc) => (
              <li key={doc.id} className="px-4 py-3 text-sm text-neutral-600">
                {doc.naziv_fajla} — {formatDateTime(doc.created_at)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
