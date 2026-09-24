import type { MetadataRoute } from "next";

// Faza 17 (2026-09-24): sitemap namerno sadrži samo strane koje su STVARNO
// javne i imaju sadržaj za indeksiranje danas. Kako budu dodavane nove javne
// strane (usluge, opštine, cene, kontakt — vidi Faza 2 predlog u statusu),
// dodati ih ovde.
const BASE_URL = "https://ruta-dostava.rs";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/opsti-uslovi`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
