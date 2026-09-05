"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, Marker } from "leaflet";

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
  has_housenumber: boolean;
}

const PIN_SVG = `
  <svg width="28" height="28" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 8c-9 0-16 7-16 16 0 12 16 26 16 26s16-14 16-26c0-9-7-16-16-16z" fill="#047857"/>
    <circle cx="32" cy="24" r="6" fill="#ffffff"/>
  </svg>
`;

export function AddressPicker({
  name,
  label,
  required,
}: {
  name: string;
  label: string;
  required?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Suggestion | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  // Tekst polja u trenutku poslednjeg izbora iz liste — dok se ne promeni,
  // ne pokrećemo novu pretragu (izbor ne sme da obriše broj koji je korisnik ukucao).
  const resolvedQueryRef = useRef<string | null>(null);

  // Pretraga adresa (debounced), preko naše /api/geocode rute.
  useEffect(() => {
    if (query.trim().length < 3 || query === resolvedQueryRef.current) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data: Suggestion[] = await res.json();
        setSuggestions(data);
        setOpen(true);
      } catch {
        // Pretraga je pomoćna funkcija — tiho odustani (korisnik i dalje može ručno da otkuca adresu).
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
      setLoading(false);
    };
  }, [query]);

  // Mapa se iscrtava tek kad je adresa izabrana iz predloga.
  useEffect(() => {
    if (!selected || !mapContainerRef.current) return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapContainerRef.current) return;

      const lat = Number(selected.lat);
      const lon = Number(selected.lon);
      const icon = L.divIcon({
        html: PIN_SVG,
        className: "",
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      if (!mapRef.current) {
        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: true,
        }).setView([lat, lon], 15);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          subdomains: "abc",
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);
        markerRef.current = L.marker([lat, lon], { icon }).addTo(map);
        mapRef.current = map;
      } else {
        mapRef.current.setView([lat, lon], 15);
        markerRef.current?.setLatLng([lat, lon]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selected]);

  // Uklanjanje mape pri unmount-u komponente.
  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const inputClass = "mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm";

  return (
    <div className="relative">
      <label className="block text-sm font-medium">{label}</label>
      <input
        name={name}
        required={required}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelected(null);
        }}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
        className={inputClass}
      />

      {loading && (
        <p className="absolute z-10 mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-neutral-500 shadow-md">
          Tražim…
        </p>
      )}

      {!loading && open && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border border-black/15 bg-white text-sm shadow-md">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={() => {
                  setSelected(s);
                  // Ne prepisujemo uneti tekst predlogom — ako korisnik unese
                  // broj koji OSM baza nema, taj broj ostaje sačuvan u polju.
                  resolvedQueryRef.current = query;
                  setSuggestions([]);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left hover:bg-neutral-50"
              >
                {s.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <>
          <div
            ref={mapContainerRef}
            className="mt-2 h-40 w-full rounded-md border border-black/10"
          />
          {!selected.has_housenumber && (
            <p className="mt-1 text-xs text-neutral-500">
              Mapa prikazuje ulicu — tačan kućni broj nije uvek precizno pozicioniran.
            </p>
          )}
        </>
      )}
    </div>
  );
}
