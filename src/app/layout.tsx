import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
// Faza 13 (reskin po Figma dizajnu): Inter za tekst, Roboto Slab za velike
// naslove (dostupno svuda preko Tailwind klase `font-serif`, vidi
// globals.css). Fontovi su samostalno hostovani preko @fontsource paketa
// (statički fajlovi u node_modules, uključeni u build) umesto next/font/
// google — sandbox okruženje ne može da dopre do fonts.googleapis.com (isto
// ograničenje mreže kao i za Mapbox u Fazi 6), a samostalno hostovanje
// izbegava tu zavisnost i na produkciji (brže učitavanje, bez spoljnog
// poziva ka Google-u). "latin-ext" podskup je obavezan da bi se ispravno
// prikazala slova č/ć/š/ž/đ, ne samo "latin".
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/latin-ext-400.css";
import "@fontsource/inter/latin-ext-500.css";
import "@fontsource/inter/latin-ext-600.css";
import "@fontsource/inter/latin-ext-700.css";
import "@fontsource/roboto-slab/600.css";
import "@fontsource/roboto-slab/700.css";
import "@fontsource/roboto-slab/latin-ext-600.css";
import "@fontsource/roboto-slab/latin-ext-700.css";
import { NavBar } from "@/components/NavBar";
import { BackButton } from "@/components/BackButton";
import { NavigationDepthTracker } from "@/components/NavigationDepthTracker";

export const metadata: Metadata = {
  title: "Ruta-Dostava — dostava u Beogradu",
  description:
    "Ruta-Dostava je B2B platforma koja povezuje firme sa kombi prevoznicima i kurirskim službama u Beogradu.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sr" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        <NavigationDepthTracker />
        <NavBar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          <BackButton />
          {children}
        </main>
        <footer className="border-t border-black/10 py-4 text-center text-xs text-black/40">
          <p>Ruta-Dostava — MVP prototip, Beograd</p>
          <p className="mt-1">
            <Link
              href="/dokumenti/politika-privatnosti.pdf"
              className="underline hover:text-black/60"
            >
              Politika privatnosti
            </Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
