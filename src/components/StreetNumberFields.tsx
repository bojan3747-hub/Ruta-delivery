"use client";

import { useState } from "react";

/**
 * Ulica/mesto i kućni broj kao dva odvojena vidljiva polja (Faza 5 backlog:
 * "odvojiti broj ulice od naziva ulice") — za mesta gde se adresa unosi kao
 * običan tekst, bez autocomplete-a (za AddressPicker vidi tu komponentu,
 * koja ima svoju, bogatiju verziju istog rešenja). Pri submit-u se spajaju
 * u JEDAN string i šalju pod postojećim `name` poljem — bez izmene šeme
 * baze.
 *
 * Broj namerno nije obavezan čak ni kad je `required` — postojeći
 * kombinovani stringovi (npr. iz ranije unetih adresa) mogu već sadržati
 * broj, pa ne želimo da force-ujemo dupli unos.
 */
export function StreetNumberFields({
  name,
  label,
  required,
  defaultValue = "",
  inputClass,
}: {
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: string;
  inputClass: string;
}) {
  const [street, setStreet] = useState(defaultValue);
  const [broj, setBroj] = useState("");
  const combined = broj.trim() ? `${street.trim()} ${broj.trim()}` : street.trim();
  // Uklanjamo "mt-1" (margina ide na wrapping div ispod) i "w-full" (širinu
  // svakog polja postavljaju flex-1/w-20 ispod — kombinovanje "w-full" sa
  // "w-20" na istom elementu bi izazvalo sukob CSS klasa iste specifičnosti
  // gde "w-full" može da pobedi i pokvari raspored, kao što se desilo u
  // ranijoj verziji ove izmene).
  const bareInputClass = inputClass.replace(/\bmt-1\b\s?/, "").replace(/\bw-full\b\s?/, "");

  return (
    <div>
      <input type="hidden" name={name} value={combined} />
      <label className="block text-sm font-medium">{label}</label>
      <div className="mt-1 flex gap-2">
        <input
          name={`${name}Ulica`}
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          required={required}
          placeholder="Ulica i mesto"
          className={`${bareInputClass} flex-1`}
        />
        <input
          name={`${name}Broj`}
          value={broj}
          onChange={(e) => setBroj(e.target.value)}
          placeholder="Broj"
          className={`${bareInputClass} w-20`}
        />
      </div>
    </div>
  );
}
