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
        <LoginForm />
      </div>
      <p className="mt-4 text-center text-sm text-neutral-600">
        Nemate nalog?{" "}
        <Link href="/registracija" className="font-medium text-emerald-600 hover:underline">
          Registrujte firmu
        </Link>
      </p>
    </div>
  );
}
