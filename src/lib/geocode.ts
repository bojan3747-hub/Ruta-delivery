// Geokodiranje adresa i računanje prave (vozne) udaljenosti preko Mapbox
// API-ja — koristi se SERVER-SIDE, pri kreiranju pošiljke, da bi se cena i
// ETA računali po pravoj ruti umesto po ručno unetoj proceni udaljenosti
// između zona (vidi src/lib/zones.ts i src/lib/pricing.ts).
//
// Sve funkcije ovde su "best effort": pri bilo kakvom problemu (nema
// tokena, mreža nedostupna, adresa nije prepoznata, isteklo vreme) vraćaju
// `null` umesto da bacaju grešku — kreiranje pošiljke NIKAD ne sme da
// zavisi od toga da li je spoljni API dostupan. Pozivalac (shipment-actions)
// se oslanja na to i pada nazad na procenu po zonama kad je rezultat null.
//
// Isti Mapbox token (NEXT_PUBLIC_MAPBOX_TOKEN) se već koristi i za
// autocomplete pretragu adresa u src/app/api/geocode/route.ts — javni je
// (client-side se koristi za prikaz mape), pa je bezbedno koristiti ga i
// ovde na serveru.

// Beograd — centar za proximity bias i geografski okvir pretrage, isto kao
// u src/app/api/geocode/route.ts (RUTA-Dostava trenutno radi isključivo u
// Beogradu).
export const BEOGRAD_LON = 20.4573;
export const BEOGRAD_LAT = 44.7866;
export const BEOGRAD_BBOX = "20.15,44.60,20.75,44.95";

const FETCH_TIMEOUT_MS = 4000;

export interface LatLon {
  lat: number;
  lon: number;
}

async function fetchWithTimeout(url: string): Promise<Response | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res.ok ? res : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Geokodira JEDNU, konačnu adresu (onu koja se stvarno šalje na server, ne
 * ono što je korisnik možda samo ukucao pa nije potvrdio iz liste predloga)
 * i vraća najbolje poklapanje. Vraća `null` ako ništa nije nađeno ili je
 * poziv iz bilo kog razloga neuspešan.
 */
export async function geocodeAddress(query: string): Promise<LatLon | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token || query.trim().length < 3) return null;

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("limit", "1");
  url.searchParams.set("language", "sr");
  url.searchParams.set("country", "RS");
  url.searchParams.set("proximity", `${BEOGRAD_LON},${BEOGRAD_LAT}`);
  url.searchParams.set("bbox", BEOGRAD_BBOX);

  const res = await fetchWithTimeout(url.toString());
  if (!res) return null;

  try {
    const data = (await res.json()) as {
      features?: { center: [number, number] }[];
    };
    const feature = data.features?.[0];
    if (!feature) return null;
    return { lon: feature.center[0], lat: feature.center[1] };
  } catch {
    return null;
  }
}

/**
 * Prava vozna udaljenost (km) između dve tačke, preko Mapbox Directions
 * API-ja (profil "driving" — kombi/kamion dostava ide drumom). Vraća `null`
 * pri bilo kom problemu.
 */
export async function drivingDistanceKm(
  from: LatLon,
  to: LatLon
): Promise<number | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;

  const url = new URL(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${from.lon},${from.lat};${to.lon},${to.lat}`
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("overview", "false");

  const res = await fetchWithTimeout(url.toString());
  if (!res) return null;

  try {
    const data = (await res.json()) as { routes?: { distance: number }[] };
    const meters = data.routes?.[0]?.distance;
    if (typeof meters !== "number") return null;
    return Math.round((meters / 1000) * 10) / 10; // km, na jednu decimalu
  } catch {
    return null;
  }
}

export interface RealRoute {
  preuzimanjeLat: number;
  preuzimanjeLon: number;
  isporukaLat: number;
  isporukaLon: number;
  udaljenostKm: number;
}

/**
 * Geokodira obe adrese pošiljke i računa pravu voznu udaljenost među njima.
 * Vraća `null` ako BILO KOJI korak ne uspe — pozivalac u tom slučaju treba
 * da padne nazad na procenu po zonama (distanceKm iz zones.ts), a
 * kreiranje pošiljke se nastavlja normalno, samo bez ovih podataka.
 */
export async function computeRealRoute(
  adresaPreuzimanja: string,
  adresaIsporuke: string
): Promise<RealRoute | null> {
  const [from, to] = await Promise.all([
    geocodeAddress(adresaPreuzimanja),
    geocodeAddress(adresaIsporuke),
  ]);
  if (!from || !to) return null;

  const km = await drivingDistanceKm(from, to);
  if (km == null) return null;

  return {
    preuzimanjeLat: from.lat,
    preuzimanjeLon: from.lon,
    isporukaLat: to.lat,
    isporukaLon: to.lon,
    udaljenostKm: km,
  };
}
