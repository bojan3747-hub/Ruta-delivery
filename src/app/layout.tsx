import type { Metadata } from "next";
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
import { NavigationDepthTracker } from "@/components/NavigationDepthTracker";

// Faza 17 (2026-09-24): SEO popravke po preporukama iz analize
// "Ruta-Dostava — SEO i vidljivost" (2026-09). Title/H1/meta description sad
// sadrže pojmove koje ljudi zaista pretražuju ("kombi prevoz", "dostava za
// firme", "Beograd") umesto samo slogana. `metadataBase` omogućava relativne
// URL-ove (npr. `alternates.canonical`, `openGraph.url`) niže u stablu strana
// bez ponavljanja punog domena na svakom mestu.
const SITE_URL = "https://ruta-dostava.rs";
const SITE_TITLE = "Kombi prevoz i dostava za firme u Beogradu | Ruta-Dostava";
const SITE_DESCRIPTION =
  "Unesite pošiljku i za par minuta uporedite ponude proverenih kombi prevoznika i kurira u Beogradu. Isti dan, i uveče.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | Ruta-Dostava",
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: "Ruta-Dostava",
    locale: "sr_RS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Faza 13 (deo 2): root layout je sad namerno "prazan" — samo html/body,
// fontovi i footer-manje deljeno stanje (NavigationDepthTracker). Gornji
// NavBar (javne strane) i bočna navigacija (portali) žive u svojim rutnim
// grupama, vidi src/app/(public)/layout.tsx i layout.tsx fajlove unutar
// klijent/dostavljac/operater.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sr" className="h-full antialiased">
      <body className="min-h-full bg-neutral-50 text-neutral-900">
        <NavigationDepthTracker />
        {children}
      </body>
    </html>
  );
}
