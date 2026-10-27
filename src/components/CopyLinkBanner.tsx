"use client";

import { useState } from "react";

// Faza 24: prikazano na vrhu /pracenje/[token] — gostov JEDINI način da se
// vrati na ovu pošiljku je ovaj link (odluka korisnika: "samo link, bez
// povratne pretrage" — nema pretrage po telefonu). Uvek vidljivo (ne samo
// odmah nakon slanja zahteva), da podseti gosta da ga sačuva i pri
// kasnijim posetama.
export function CopyLinkBanner() {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <span>
        Sačuvajte ovaj link — to je jedini način da pratite ovu pošiljku.
        Nemamo mogućnost da vam ga pošaljemo ponovo po broju telefona.
      </span>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard
            .writeText(window.location.href)
            .then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            })
            .catch(() => {});
        }}
        className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
      >
        {copied ? "Kopirano!" : "Kopiraj link"}
      </button>
    </div>
  );
}
