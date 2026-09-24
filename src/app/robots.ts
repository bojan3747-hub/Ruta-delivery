import type { MetadataRoute } from "next";

// Faza 17 (2026-09-24): isključuje iz indeksiranja sve strane koje nemaju
// SEO vrednost i/ili su iza prijave — auth tokovi (prijava, registracija,
// aktivacija, reset lozinke) i sva tri autentifikovana portala. Robots.txt
// prefiksno poklapa putanju, pa npr. "/klijent" već pokriva i
// "/klijent/nova-posiljka" i sve ostalo ispod njega — nema potrebe za
// posebnim unosom za svaku podputanju. Javno indeksabilne strane ostaju
// samo "/" i "/opsti-uslovi" (vidi sitemap.ts).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/prijava",
        "/registracija",
        "/aktivacija",
        "/reset-lozinke",
        "/zaboravljena-lozinka",
        "/klijent",
        "/dostavljac",
        "/operater",
      ],
    },
    sitemap: "https://ruta-dostava.rs/sitemap.xml",
  };
}
