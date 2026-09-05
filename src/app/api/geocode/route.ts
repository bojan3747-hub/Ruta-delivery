import { NextRequest, NextResponse } from "next/server";

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.trim().length < 3) return NextResponse.json([]);

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", q);
  url.searchParams.set("countrycodes", "rs");
  url.searchParams.set("limit", "5");
  url.searchParams.set("accept-language", "sr");

  try {
    const res = await fetch(url, {
      headers: {
        // Nominatim-ova politika korišćenja traži identifikaciju klijenta;
        // browser fetch ne dozvoljava User-Agent, pa se ovaj poziv radi
        // sa servera, gde može da se postavi.
        "User-Agent": "Ruta-Dostava/1.0 (MVP aplikacija za dostavu, Beograd)",
      },
    });
    if (!res.ok) return NextResponse.json([]);

    const data = (await res.json()) as NominatimResult[];
    return NextResponse.json(
      data.map((d) => ({
        display_name: d.display_name,
        lat: d.lat,
        lon: d.lon,
      }))
    );
  } catch {
    return NextResponse.json([]);
  }
}
