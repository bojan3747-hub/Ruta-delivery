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
    <div className="space-y-16">
      <section className="space-y-4 py-8 text-center">
        <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
          B2B platforma za dostavu
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900">
          Dostava u Beogradu, na jednom mestu
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-neutral-600">
          Ruta-Dostava je napravljena za firme kojima je povremeno ili redovno
          potrebna dostava — a ne žele da zovu pet različitih prevoznika da
          uporede cenu i dostupnost. Unesite pošiljku, uporedite ponude
          proverenih kombi prevoznika i kurirskih službi, pratite isporuku —
          sve na jednom mestu.
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

      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Koji problem rešavamo</h2>
          <p className="mx-auto mt-2 max-w-2xl text-neutral-600">
            Firmama je dostava retko potpuno predvidljiva — nekad je paket mali
            i hitan, nekad je pošiljka koju treba dogovoriti unapred.
            Standardne kurirske službe rade po fiksnom rasporedu i jednoj ceni,
            a poređenje ponuda više prevoznika ručno (telefonom, porukama)
            oduzima vreme koje firma nema.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-lg border border-black/10 bg-white p-5">
            <h3 className="font-semibold">Više prevoznika, jedna prijava</h3>
            <p className="mt-1 text-sm text-neutral-600">
              Umesto da zovete svakog kombi prevoznika posebno, Ruta-Dostava
              odmah prikuplja ponude aktivnih dostavljača koji pokrivaju vaše
              zone.
            </p>
          </div>
          <div className="rounded-lg border border-black/10 bg-white p-5">
            <h3 className="font-semibold">Fleksibilan termin</h3>
            <p className="mt-1 text-sm text-neutral-600">
              Pošiljka ne mora da čeka radno vreme klasične kurirske službe —
              možete zakazati tačno vreme, uključujući popodne ili veče,
              ukoliko na adresi ima ko da je preuzme.
            </p>
          </div>
          <div className="rounded-lg border border-black/10 bg-white p-5">
            <h3 className="font-semibold">Napravljeno za firme</h3>
            <p className="mt-1 text-sm text-neutral-600">
              Nalog firme, istorija svih pošiljki i porudžbina na jednom
              mestu, ocene dostavljača — bez papirologije koja ide uz
              ugovaranje sa više pojedinačnih prevoznika.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-6">
        <h2 className="text-center text-2xl font-semibold">Kako radi</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div>
            <h3 className="font-semibold">1. Unesite pošiljku</h3>
            <p className="mt-1 text-sm text-neutral-600">
              Zona preuzimanja i isporuke, tip pošiljke, željeni termin — traje
              manje od minuta.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">2. Uporedite ponude</h3>
            <p className="mt-1 text-sm text-neutral-600">
              Automatske ponude za standardne pošiljke stižu za par sekundi;
              nestandardne šalju dostavljači ručno.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">3. Pratite isporuku</h3>
            <p className="mt-1 text-sm text-neutral-600">
              Status uživo od preuzimanja do isporuke, i ocena dostavljača na
              kraju.
            </p>
          </div>
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
