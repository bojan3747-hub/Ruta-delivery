import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { BackButton } from "@/components/BackButton";

/**
 * Faza 13 (deo 2): javne strane (landing, prijava, registracija, opšti
 * uslovi, aktivacija, reset lozinke...) zadržavaju gornji NavBar + uzak
 * (max-w-5xl) centriran sadržaj — ovo je izdvojeno iz ranijeg root layout-a
 * u posebnu rutnu grupu da bi tri autentifikovana portala (klijent/
 * dostavljač/operater) mogla da koriste svoj sopstveni layout sa bočnom
 * navigacijom (vidi src/components/PortalSidebar.tsx) bez dupliranja
 * NavBar-a iznad nje.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <NavBar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <BackButton />
        {children}
      </main>
      <footer className="border-t border-black/10 py-4 text-center text-xs text-black/40">
        {/* Faza 17 (2026-09-24): "MVP prototip" je SEO analiza označila kao
            signal koji odbija poverenje — zamenjeno neutralnijom formulacijom.
            Pravi naziv firme/PIB/kontakt i dalje čekaju korisnikove podatke
            (vidi status doc, Faza 1/2) — namerno se ne izmišljaju ovde. */}
        <p>Ruta-Dostava — u probnom radu, Beograd</p>
        <p className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <Link
            href="/dokumenti/politika-privatnosti.pdf"
            className="underline hover:text-black/60"
          >
            Politika privatnosti
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/opsti-uslovi" className="underline hover:text-black/60">
            Opšti uslovi korišćenja
          </Link>
        </p>
      </footer>
    </div>
  );
}
