import Link from "next/link";
import { readPendingGoogleProfile } from "@/lib/google-auth";
import { GoogleRegistrationForm } from "@/components/GoogleRegistrationForm";

// Faza 20: stiže se ovde sa /auth/google/callback kad Google profil ne
// odgovara postojećem nalogu — profil čeka u kratkotrajnom kolačiću.
export default async function RegistracijaGooglePage() {
  const profile = await readPendingGoogleProfile();

  if (!profile) {
    return (
      <div className="mx-auto max-w-sm py-6 text-center">
        <h1 className="font-serif text-2xl font-bold text-neutral-900">
          Sesija je istekla
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Nismo pronašli Google podatke za registraciju — verovatno je prošlo
          previše vremena. Pokušajte ponovo.
        </p>
        <Link
          href="/registracija"
          className="mt-4 inline-block font-medium text-emerald-600 hover:underline"
        >
          Nazad na registraciju
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm py-6">
      <div className="mb-6 text-center">
        <h1 className="font-serif text-2xl font-bold text-neutral-900">
          Skoro gotovo
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Prijavljeni ste preko Google-a — samo još telefon i prihvatanje
          uslova.
        </p>
      </div>
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <GoogleRegistrationForm ime={profile.name} email={profile.email} />
      </div>
    </div>
  );
}
