import { NextRequest, NextResponse } from "next/server";
import { toLatin } from "@/lib/cyrillic";

interface PhotonFeature {
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    country?: string;
  };
  geometry: {
    coordinates: [number, number]; // [lon, lat]
  };
}

// Beograd, za sortiranje rezultata po blizini centru grada.
const BEOGRAD_LON = 20.4573;
const BEOGRAD_LAT = 44.7866;

// RUTA-Dostava trenutno radi isključivo u Beogradu (sve zone u aplikaciji su
// beogradske opštine), pa pretragu tvrdo ograničavamo na širu teritoriju
// grada — ovo isključuje i istoimene ulice u drugim gradovima/zemljama
// (npr. "Kneza Miloša" postoji i van Beograda) i selâ širom Srbije.
const BEOGRAD_BBOX = "20.15,44.60,20.75,44.95"; // minLon,minLat,maxLon,maxLat

function displayName(props: PhotonFeature["properties"]): string {
  const parts: string[] = [];
  if (props.street) {
    parts.push(props.housenumber ? `${props.street} ${props.housenumber}` : props.street);
  } else if (props.name) {
    parts.push(props.name);
  }
  if (props.city) parts.push(props.city);
  if (props.country) parts.push(props.country);
  return toLatin(parts.join(", "));
}

function distanceFromBeograd(lat: number, lon: number): number {
  // Nije potrebna prava Haversine formula — na ovako maloj oblasti
  // (jedan grad) obična euklidska razdaljina dovoljno dobro sortira.
  return Math.hypot(lat - BEOGRAD_LAT, lon - BEOGRAD_LON);
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.trim().length < 3) return NextResponse.json([]);

  // Photon (komoot.io) — javan, besplatan geokoder nad OpenStreetMap podacima,
  // bez potrebe za nalogom/ključem, i osetno brži od javnog Nominatim servera.
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "15");
  url.searchParams.set("lat", String(BEOGRAD_LAT));
  url.searchParams.set("lon", String(BEOGRAD_LON));
  url.searchParams.set("bbox", BEOGRAD_BBOX);

  try {
    const res = await fetch(url);
    if (!res.ok) return NextResponse.json([]);

    const data = (await res.json()) as { features: PhotonFeature[] };
    const seen = new Set<string>();
    const results = (data.features ?? [])
      .map((f) => ({
        display_name: displayName(f.properties),
        lat: f.geometry.coordinates[1],
        lon: f.geometry.coordinates[0],
        has_housenumber: Boolean(f.properties.housenumber),
      }))
      .filter((r) => {
        if (!r.display_name || seen.has(r.display_name)) return false;
        seen.add(r.display_name);
        return true;
      })
      .sort(
        (a, b) => distanceFromBeograd(a.lat, a.lon) - distanceFromBeograd(b.lat, b.lon)
      )
      .slice(0, 5)
      .map((r) => ({
        display_name: r.display_name,
        lat: String(r.lat),
        lon: String(r.lon),
        has_housenumber: r.has_housenumber,
      }));

    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}
