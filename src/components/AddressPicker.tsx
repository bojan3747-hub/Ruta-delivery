"use client";

import { useEffect, useState } from "react";

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
  has_housenumber: boolean;
}

/**
 * Ulica (sa autocomplete pretragom) i kućni broj kao dva odvojena vidljiva
 * polja (Faza 5 backlog: "odvojiti broj ulice od naziva ulice"). Pri
 * submit-u se spajaju u JEDAN string i šalju pod postojećim `name` poljem
 * — bez izmene šeme baze i bez ikakvih izmena na strani servera.
 *
 * Broj namerno NIJE HTML-obavezan (za razliku od polja ulice): prefill iz
 * sačuvane adrese ili sedišta firme već može da sadrži broj kao deo jednog
 * kombinovanog stringa, pa ne želimo da force-ujemo dupli unos. Ako se
 * polje Broj ne popuni, šalje se samo uneta ulica — nepromenjeno u odnosu
 * na raniji format jednog polja.
 */
export function AddressPicker({
  name,
  label,
  required,
  initialValue,
}: {
  name: string;
  label: string;
  required?: boolean;
  initialValue?: string;
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [query, setQuery] = useState(initialValue ?? "");
  const [broj, setBroj] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Suggestion | null>(null);

  // Tekst polja u trenutku poslednjeg izbora iz liste — dok se ne promeni,
  // ne pokrećemo novu pretragu (izbor ne sme da obriše broj koji je korisnik ukucao).
  // Sačuvana adresa iz adresara se tretira isto — ne pokreće pretragu čim se učita.
  const [resolvedQuery, setResolvedQuery] = useState<string | null>(
    initialValue ?? null
  );

  // Pretraga adresa (debounced), preko naše /api/geocode rute.
  useEffect(() => {
    if (query.trim().length < 3 || query === resolvedQuery) {
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
  }, [query, resolvedQuery]);

  const baseInputClass = "rounded-md border border-black/15 px-3 py-2 text-sm";
  const inputClass = `w-full ${baseInputClass}`;
  const combined = broj.trim() ? `${query.trim()} ${broj.trim()}` : query.trim();

  return (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      {/* Kombinovana vrednost (ulica + broj) — ovo je jedino polje koje server vidi. */}
      <input type="hidden" name={name} value={combined} />

      <div className="mt-1 flex gap-2">
        <div className="relative flex-1">
          <input
            name={`${name}Ulica`}
            required={required}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
            }}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            autoComplete="off"
            placeholder="Ulica, mesto, opština"
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
                      // broj koji baza nema, taj broj ostaje sačuvan u polju.
                      setResolvedQuery(query);
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
        </div>

        <input
          name={`${name}Broj`}
          value={broj}
          onChange={(e) => setBroj(e.target.value)}
          placeholder="Broj"
          className={`w-20 ${baseInputClass}`}
        />
      </div>

      {selected && token && (
        <>
          <img
            src={
              `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/` +
              `pin-s+047857(${selected.lon},${selected.lat})/` +
              `${selected.lon},${selected.lat},15,0/400x160@2x` +
              `?access_token=${token}`
            }
            alt="Lokacija na mapi"
            width={400}
            height={160}
            className="mt-2 h-auto w-full rounded-md border border-black/10"
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
