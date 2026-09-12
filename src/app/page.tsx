import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { CourierInterestForm } from "@/components/CourierInterestForm";

const ROLE_HOME: Record<string, string> = {
  CLIENT: "/klijent",
  COURIER: "/dostavljac",
  OPERATOR: "/operater",
};

const ROLE_LABELS: Record<string, string> = {
  CLIENT: "Klijent",
  COURIER: "Dostavljač",
  OPERATOR: "Operater",
};

const ROLE_PANEL_LABELS: Record<string, string> = {
  CLIENT: "Idi na klijentski panel",
  COURIER: "Idi na dostavljački panel",
  OPERATOR: "Idi na operaterski panel",
};

export default async function HomePage() {
  // Landing page je ista za sve, ali ko je već ulogovan vidi drugačiju
  // dugmad u hero sekciji (vidi niže) umesto automatskog redirekta —
  // logo sada uvek vodi na "/", pa se ovde ulogovani korisnici mogu
  // vratiti, a odavde nazad u svoj panel.
  const user = await getCurrentUser();

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
        {user ? (
          <div className="flex flex-col items-center gap-2 pt-2">
            <Link
              href={ROLE_HOME[user.role]}
              className="rounded-md bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-800"
            >
              {ROLE_PANEL_LABELS[user.role]}
            </Link>
            <span className="text-xs text-neutral-500">
              Ulogovani ste kao {user.ime} · {ROLE_LABELS[user.role]}
            </span>
          </div>
        ) : (
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
        )}
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
        <h2 className="text-2xl font-semibold">
          Vozite kombi ili kamionet? Zaradite dodatno uz Ruta-Dostavu.
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-neutral-600">
          Firmama u Beogradu treba prevoz za veće i nestandardne pošiljke koje
          klasične kurirske službe teško pokrivaju — Ruta-Dostava vas povezuje
          sa njima.
        </p>
        <div className="mx-auto mt-6 grid max-w-3xl gap-6 text-left sm:grid-cols-3">
          <div className="rounded-lg bg-neutral-50 p-4">
            <h3 className="font-semibold">Vi određujete cenu</h3>
            <p className="mt-1 text-sm text-neutral-600">
              Za standardne zahteve sami šaljete ponudu — cenu i vreme
              isporuke birate vi, ne mi.
            </p>
          </div>
          <div className="rounded-lg bg-neutral-50 p-4">
            <h3 className="font-semibold">Bez pretplate</h3>
            <p className="mt-1 text-sm text-neutral-600">
              Nema ulaznog troška ni mesečne pretplate — provizija se
              naplaćuje samo na završenu isporuku.
            </p>
          </div>
          <div className="rounded-lg bg-neutral-50 p-4">
            <h3 className="font-semibold">Dodatni posao</h3>
            <p className="mt-1 text-sm text-neutral-600">
              Prihvatate samo zahteve koji vam odgovaraju, pored posla koji
              već imate — bez obaveze i bez ekskluzivnosti.
            </p>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-xl border-t border-black/10 pt-6">
          <h3 className="font-semibold">Prijavite se za saradnju</h3>
          <p className="mt-1 text-sm text-neutral-600">
            Ostavite osnovne podatke — kontaktiraćemo vas da dogovorimo
            detalje i otvorimo vam nalog.
          </p>
          <div className="mt-4">
            <CourierInterestForm />
          </div>
          <p className="mt-4 text-xs text-neutral-400">
            Ako vas je Ruta-Dostava već kontaktirala, aktivirajte nalog preko
            linka koji ste dobili umesto ove forme.
          </p>
        </div>
      </section>
    </div>
  );
}
