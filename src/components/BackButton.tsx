"use client";

import { usePathname, useRouter } from "next/navigation";

/**
 * Faza 7: "nazad" treba da ide dokle ima smisla, ne van sajta. Koristimo
 * router.back() kad znamo da ima gde da se vrati UNUTAR aplikacije (vidi
 * NavigationDepthTracker); ako te istorije nema (direktan ulaz na stranu,
 * bookmark, nova kartica), padamo na landing ("/"), koja se sama grana na
 * ulogovan/gost prikaz (vidi src/app/page.tsx) — tako "nazad" nikad ne
 * odvede korisnika van sajta niti ostane bez efekta.
 */
export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  // No meaningful "back" from the public landing page.
  if (pathname === "/") return null;

  function handleClick() {
    let depth = 0;
    try {
      depth = Number(sessionStorage.getItem("rutaNavDepth") ?? "0");
    } catch {
      depth = 0;
    }
    if (depth > 0) {
      router.back();
    } else {
      router.push("/");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900"
    >
      ← Nazad
    </button>
  );
}
