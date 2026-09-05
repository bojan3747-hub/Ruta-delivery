import { NextRequest, NextResponse } from "next/server";

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

// Beograd, za relevantnije rezultate pretrage (proximity bias).
const BEOGRAD_LON = 20.4573;
const BEOGRAD_LAT = 44.7866;

function displayName(props: PhotonFeature["properties"]): string {
  const parts: string[] = [];
  if (props.street) {
    parts.push(props.housenumber ? `${props.street} ${props.housenumber}` : props.street);
  } else if (props.name) {
    parts.push(props.name);
  }
  if (props.city) parts.push(props.city);
  if (props.country) parts.push(props.country);
  return parts.join(", ");
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.trim().length < 3) return NextResponse.json([]);

  // Photon (komoot.io) — javan, besplatan geokoder nad OpenStreetMap podacima,
  // bez potrebe za nalogom/ključem, i osetno brži od javnog Nominatim servera.
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "5");
  url.searchParams.set("lat", String(BEOGRAD_LAT));
  url.searchParams.set("lon", String(BEOGRAD_LON));

  try {
    const res = await fetch(url);
    if (!res.ok) return NextResponse.json([]);

    const data = (await res.json()) as { features: PhotonFeature[] };
    const results = (data.features ?? [])
      .map((f) => ({
        display_name: displayName(f.properties),
        lat: String(f.geometry.coordinates[1]),
        lon: String(f.geometry.coordinates[0]),
      }))
      .filter((r) => r.display_name);

    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}
