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
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 px-6 py-12 text-white sm:px-10 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              B2B platforma za dostavu
            </span>
            <h1 className="font-serif text-4xl font-bold leading-tight sm:text-5xl">
              Kombi prevoz i dostava za
              <br />
              firme u <span className="text-emerald-400">Beogradu</span>
            </h1>
            <p className="text-sm font-medium uppercase tracking-wide text-slate-400">
              Od manjih paketa do kamionskog tereta — na vreme, svaki put.
            </p>
            <p className="max-w-md text-base text-slate-300">
              Ruta-Dostava je napravljena za firme kojima je povremeno ili
              redovno potrebna dostava — a ne žele da zovu pet različitih
              prevoznika da uporede cenu i dostupnost. Unesite pošiljku,
              uporedite ponude proverenih kombi i kamionskih prevoznika i
              kurirskih službi, pratite isporuku — sve na jednom mestu.
            </p>
            {user ? (
              <div className="flex flex-col items-start gap-2 pt-2">
                <Link
                  href={ROLE_HOME[user.role]}
                  className="rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-medium text-slate-900 hover:bg-emerald-400"
                >
                  {ROLE_PANEL_LABELS[user.role]}
                </Link>
                <span className="text-xs text-slate-400">
                  Ulogovani ste kao {user.ime} · {ROLE_LABELS[user.role]}
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/registracija"
                  className="rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-medium text-slate-900 hover:bg-emerald-400"
                >
                  Registrujte firmu
                </Link>
                <Link
                  href="/prijava"
                  className="rounded-md border border-white/30 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10"
                >
                  Prijavite se
                </Link>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Kako izgleda praćenje isporuke
            </p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  <div>
                    <p className="text-sm font-medium">Novi Beograd → Zemun</p>
                    <p className="text-xs text-slate-400">Srednji paket</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-blue-300">
                  U tranzitu
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <div>
                    <p className="text-sm font-medium">Vračar → Novi Beograd</p>
                    <p className="text-xs text-slate-400">Mali paket · Hitno</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-emerald-300">
                  Isporučeno
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <div>
                    <p className="text-sm font-medium">Čukarica → Voždovac</p>
                    <p className="text-xs text-slate-400">
                      Veliki paket · Nestandardna
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-amber-300">
                  Preuzeto
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="text-center">
          <h2 className="font-serif text-2xl font-semibold">
            Koji problem rešavamo
          </h2>
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
        <h2 className="text-center font-serif text-2xl font-semibold">
          Kako radi
        </h2>
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
        <h2 className="font-serif text-2xl font-semibold">
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
