import { NextRequest, NextResponse } from "next/server";
import { toLatin } from "@/lib/cyrillic";

interface MapboxFeature {
  place_name: string;
  center: [number, number]; // [lon, lat]
  place_type: string[];
}

// Beograd — centar za proximity bias i geografski okvir pretrage.
// RUTA-Dostava trenutno radi isključivo u Beogradu (sve zone u aplikaciji
// su beogradske opštine), pa nema smisla vraćati adrese iz drugih gradova.
const BEOGRAD_LON = 20.4573;
const BEOGRAD_LAT = 44.7866;
const BEOGRAD_BBOX = "20.15,44.60,20.75,44.95"; // minLon,minLat,maxLon,maxLat

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.trim().length < 3) return NextResponse.json([]);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return NextResponse.json([]);

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("autocomplete", "true");
  url.searchParams.set("limit", "5");
  url.searchParams.set("language", "sr");
  url.searchParams.set("country", "RS");
  url.searchParams.set("proximity", `${BEOGRAD_LON},${BEOGRAD_LAT}`);
  url.searchParams.set("bbox", BEOGRAD_BBOX);

  try {
    const res = await fetch(url);
    if (!res.ok) return NextResponse.json([]);

    const data = (await res.json()) as { features: MapboxFeature[] };
    const results = (data.features ?? []).map((f) => ({
      display_name: toLatin(f.place_name),
      lat: String(f.center[1]),
      lon: String(f.center[0]),
      has_housenumber: f.place_type.includes("address"),
    }));

    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}
