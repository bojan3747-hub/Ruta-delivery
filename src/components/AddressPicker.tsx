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
 *
 * BAGFIX (prijavio korisnik, 2026-09-09): klik na predlog iz autocomplete
 * liste je ranije SAMO markirao predlog za mapu, ne i menjao tekst u polju
 * Ulica — ako je korisnik kliknuo pre nego što je dovršio kucanje, u polju
 * je ostajao nedovršen tekst (npr. "jovana be" umesto pune ulice). Dodatno,
 * kad predlog već sadrži kućni broj (has_housenumber), a korisnik je ISTO
 * TAKO popunio odvojeno polje Broj, broj se duplirao u finalnoj adresi
 * (npr. "Ulica 16 16"). Sad klik na predlog upisuje pun, tačan tekst u
 * Ulicu, i prazni Broj SAMO kad predlog već nosi kućni broj (kad ne nosi,
 * već uneti Broj ostaje netaknut — ista logika kao pre, samo primenjena
 * selektivno).
 *
 * Faza 7 ("kad se unese broj, mapa treba da se azurira i prikaze bas taj
 * broj"): dok god se biralo SAMO iz predloga, mapa je prikazivala tacku
 * ulice iz tog predloga -- kad bi korisnik posle toga otkucao broj u
 * odvojeno polje Broj, mapa je ostajala na staroj (samo-ulica) tacki. Sad,
 * kad postoji izabrana ulica I uneti broj, dodatno (debounced) geokodiramo
 * KOMBINOVANU adresu (ulica + broj) i tu, precizniju tacku prikazujemo na
 * mapi umesto stare -- vidi `numberedSelected` nize. Best-effort: ako to
 * geokodiranje ne uspe, mapa jednostavno ostaje na nivou ulice (postojece
 * ponasanje), nista se ne blokira.
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
  // Faza 7: precizna tačka za Ulica+Broj zajedno (vidi komentar iznad
  // komponente) — kad postoji, koristi se za mapu UMESTO `selected`.
  const [numberedSelected, setNumberedSelected] = useState<Suggestion | null>(
    null
  );

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

  // Kad je izabrana ulica (klik na predlog) I korisnik unese broj, ponovo
  // geokodiramo kombinovanu adresu da mapa prikaže tačan broj, ne samo
  // ulicu. Best-effort — neuspeh tiho ostavlja mapu na nivou ulice.
  useEffect(() => {
    if (!selected || !broj.trim()) {
      setNumberedSelected(null);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const combinedQuery = `${query.trim()} ${broj.trim()}`;
        const res = await fetch(
          `/api/geocode?q=${encodeURIComponent(combinedQuery)}`,
          { signal: controller.signal }
        );
        const data: Suggestion[] = await res.json();
        if (data[0]) setNumberedSelected(data[0]);
      } catch {
        // Mapa jednostavno ostaje na nivou ulice — vidi komentar iznad.
      }
    }, 500);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [broj, selected, query]);

  const baseInputClass = "rounded-md border border-black/15 px-3 py-2 text-sm";
  const inputClass = `w-full ${baseInputClass}`;
  const combined = broj.trim() ? `${query.trim()} ${broj.trim()}` : query.trim();
  const mapPoint = numberedSelected ?? selected;

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
                      // Upisujemo pun, tačan tekst predloga u polje — vidi
                      // BAGFIX napomenu u komentaru iznad komponente.
                      setQuery(s.display_name);
                      setResolvedQuery(s.display_name);
                      // Predlog već sadrži kućni broj -> praznimo Broj da
                      // izbegnemo dupliranje (npr. "Ulica 16" + "16").
                      // Ako predlog NE sadrži broj, već uneti Broj ostaje.
                      if (s.has_housenumber) {
                        setBroj("");
                      }
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
      <p className="mt-1 text-xs text-neutral-400">
        Ostavite polje Broj prazno ako je kućni broj već deo teksta u polju
        Ulica.
      </p>

      {mapPoint && token && (
        <>
          <img
            src={
              `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/` +
              `pin-s+047857(${mapPoint.lon},${mapPoint.lat})/` +
              `${mapPoint.lon},${mapPoint.lat},15,0/400x160@2x` +
              `?access_token=${token}`
            }
            alt="Lokacija na mapi"
            width={400}
            height={160}
            className="mt-2 h-auto w-full rounded-md border border-black/10"
          />
          {!mapPoint.has_housenumber && (
            <p className="mt-1 text-xs text-neutral-500">
              Mapa prikazuje ulicu — tačan kućni broj nije uvek precizno pozicioniran.
            </p>
          )}
        </>
      )}
    </div>
  );
}
