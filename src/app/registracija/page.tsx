import Link from "next/link";
import { RegisterForm } from "@/components/RegisterForm";

export default function RegistracijaPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Registracija firme (klijent)</h1>
      <p className="text-sm text-neutral-600">
        Registracija je za firme koje šalju pošiljke. Dostavljače na
        platformu dodaje operater — ako ste kontaktirani kao prevoznik,
        koristite link za aktivaciju koji ste dobili.
      </p>
      <RegisterForm />
      <p className="text-sm text-neutral-600">
        Već imate nalog?{" "}
        <Link href="/prijava" className="text-emerald-700 hover:underline">
          Prijavite se
        </Link>
      </p>
    </div>
  );
}
