import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

export default async function PrijavaPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const aktivirano = params.aktivirano === "1";
  const resetovano = params.resetovano === "1";

  // Faza 20: greške iz Google prijave stižu ovde preko query parametra
  // (redirekcija sa /auth/google/callback), pošto ruta nema svoj UI.
  const greska = typeof params.greska === "string" ? params.greska : null;
  const GOOGLE_GRESKE: Record<string, string> = {
    google: "Prijava preko Google-a nije uspela. Pokušajte ponovo.",
    google_nepodesen:
      "Prijava preko Google-a trenutno nije podešena na sajtu. Prijavite se emailom i lozinkom.",
    google_email_zauzet:
      "Nalog sa ovim emailom već postoji kao drugi tip naloga. Prijavite se emailom i lozinkom.",
    google_email_nepotvrdjen:
      "Vaš Google email nije verifikovan, pa ne možemo bezbedno da povežemo nalog. Prijavite se emailom i lozinkom.",
  };
  const googleGreska = greska ? GOOGLE_GRESKE[greska] : null;

  return (
    <div className="mx-auto max-w-sm py-6">
      <div className="mb-6 text-center">
        <h1 className="font-serif text-2xl font-bold text-neutral-900">
          Dobrodošli nazad
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Prijavite se na svoj nalog
        </p>
      </div>
      <div className="space-y-4 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        {aktivirano && (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 border border-emerald-200">
            Nalog je aktiviran. Prijavite se svojim emailom i lozinkom.
          </p>
        )}
        {resetovano && (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 border border-emerald-200">
            Lozinka je promenjena. Prijavite se novom lozinkom.
          </p>
        )}
        {googleGreska && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 border border-red-200">
            {googleGreska}
          </p>
        )}
        <LoginForm />
      </div>
      <p className="mt-4 text-center text-sm text-neutral-600">
        Nemate nalog?{" "}
        <Link href="/registracija" className="font-medium text-emerald-600 hover:underline">
          Registrujte se
        </Link>
      </p>
    </div>
  );
}
