import { listPendingPasswordResets } from "@/lib/queries/password-reset";
import { formatDateTime } from "@/lib/labels";

const ROLE_LABELS: Record<string, string> = {
  CLIENT: "Klijent",
  COURIER: "Dostavljač",
  OPERATOR: "Operater",
};

export default async function ResetLozinkeOperaterPage() {
  const pending = await listPendingPasswordResets();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Zahtevi za reset lozinke</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Korisnik je zatražio reset sa stranice za prijavu. Pošto aplikacija
          još ne šalje mejlove, link ispod prosledite korisniku ručno (telefon,
          WhatsApp...) — važi do isteka navedenog vremena.
        </p>
      </div>

      {pending.length === 0 ? (
        <p className="rounded-lg border border-dashed border-black/15 p-8 text-center text-neutral-500">
          Trenutno nema aktivnih zahteva.
        </p>
      ) : (
        <ul className="divide-y divide-black/10 rounded-lg border border-black/10 bg-white">
          {pending.map((p) => (
            <li key={p.id} className="px-4 py-3">
              <p className="font-medium">
                {p.ime} · {ROLE_LABELS[p.role] ?? p.role}
              </p>
              <p className="text-sm text-neutral-500">
                {p.email}
                {p.telefon ? ` · ${p.telefon}` : ""}
              </p>
              <p className="mt-1 text-sm">
                Link:{" "}
                <a
                  href={`/reset-lozinke/${p.reset_token}`}
                  className="text-emerald-700 underline hover:text-emerald-800"
                >
                  /reset-lozinke/{p.reset_token}
                </a>
              </p>
              <p className="text-xs text-neutral-500">
                Važi do: {formatDateTime(p.reset_token_expires_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
