import Link from "next/link";
import { RegisterForm } from "@/components/RegisterForm";

export default function RegistracijaPage() {
  return (
    <div className="mx-auto max-w-md py-6">
      <div className="mb-6 text-center">
        <h1 className="font-serif text-2xl font-bold text-neutral-900">
          Registracija firme
        </h1>
        <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-500">
          Registracija je za firme koje šalju pošiljke. Dostavljače na
          platformu dodaje operater — ako ste kontaktirani kao prevoznik,
          koristite link za aktivaciju koji ste dobili.
        </p>
      </div>
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <RegisterForm />
      </div>
      <p className="mt-4 text-center text-sm text-neutral-600">
        Već imate nalog?{" "}
        <Link href="/prijava" className="font-medium text-emerald-600 hover:underline">
          Prijavite se
        </Link>
      </p>
    </div>
  );
}
