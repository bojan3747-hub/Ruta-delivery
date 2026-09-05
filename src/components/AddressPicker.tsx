"use client";

import { useEffect, useState } from "react";

interface Suggestion {
  place_name: string;
  center: [number, number]; // [lng, lat]
}

// Beograd, za relevantnije rezultate pretrage (proximity bias).
const BEOGRAD_LNG = 20.4573;
const BEOGRAD_LAT = 44.7866;

export function AddressPicker({
  name,
  label,
  required,
}: {
  name: string;
  label: string;
  required?: boolean;
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Suggestion | null>(null);

  useEffect(() => {
    if (!token || query.length < 3 || selected?.place_name === query) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const url =
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
          `?access_token=${token}&autocomplete=true&limit=5&language=sr` +
          `&country=RS&proximity=${BEOGRAD_LNG},${BEOGRAD_LAT}`;
        const res = await fetch(url, { signal: controller.signal });
        const data = await res.json();
        setSuggestions(data.features ?? []);
        setOpen(true);
      } catch {
        // Pretraga je pomoćna funkcija — tiho odustani (korisnik i dalje može ručno da otkuca adresu).
      }
    }, 300);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, token, selected]);

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

      {open && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border border-black/15 bg-white text-sm shadow-md">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={() => {
                  setSelected(s);
                  setQuery(s.place_name);
                  setSuggestions([]);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left hover:bg-neutral-50"
              >
                {s.place_name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && token && (
        <img
          src={
            `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/` +
            `pin-s+047857(${selected.center[0]},${selected.center[1]})/` +
            `${selected.center[0]},${selected.center[1]},14,0/400x160@2x` +
            `?access_token=${token}`
          }
          alt="Lokacija na mapi"
          width={400}
          height={160}
          className="mt-2 h-auto w-full rounded-md border border-black/10"
        />
      )}
    </div>
  );
}
