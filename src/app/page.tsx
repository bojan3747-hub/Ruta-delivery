import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

const ROLE_HOME: Record<string, string> = {
  CLIENT: "/klijent",
  COURIER: "/dostavljac",
  OPERATOR: "/operater",
};

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role]);

  return (
    <div className="space-y-12">
      <section className="space-y-4 py-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900">
          Dostava u Beogradu, na jednom mestu
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-neutral-600">
          Ruta-Dostava povezuje firme sa proverenim kombi prevoznicima i kurirskim
          službama u Beogradu. Unesite pošiljku, uporedite ponude, pratite
          isporuku — sve na jednoj platformi.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/registracija"
            className="rounded-md bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-800"
          >
            Registrujte firmu
          </Link>
          <Link
            href="/prijava"
            className="rounded-md border border-[#1e3a5f] px-5 py-2.5 text-sm font-medium text-[#1e3a5f] hover:bg-[#1e3a5f]/5"
          >
            Prijavite se
          </Link>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-lg border border-black/10 bg-white p-5">
          <h2 className="font-semibold">1. Unesite pošiljku</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Zona preuzimanja i isporuke, tip pošiljke, željeni termin — traje
            manje od minuta.
          </p>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-5">
          <h2 className="font-semibold">2. Uporedite ponude</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Automatske ponude za standardne pošiljke stižu za par sekundi;
            nestandardne šalju dostavljači ručno.
          </p>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-5">
          <h2 className="font-semibold">3. Pratite isporuku</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Status uživo od preuzimanja do isporuke, i ocena dostavljača na
            kraju.
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-6 text-center">
        <h2 className="font-semibold">Vozite kombi ili ste kurirska služba?</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Naloge za dostavljače trenutno kreira operater platforme na osnovu
          direktnog kontakta. Ako vas je Ruta-Dostava kontaktirala, aktivirajte nalog
          preko linka koji ste dobili.
        </p>
      </section>
    </div>
  );
}
