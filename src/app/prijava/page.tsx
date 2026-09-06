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
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-semibold">Prijava</h1>
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
      <p className="text-sm text-neutral-600">
        Nemate nalog?{" "}
        <Link href="/registracija" className="text-emerald-700 hover:underline">
          Registrujte firmu
        </Link>
      </p>
    </div>
  );
}
