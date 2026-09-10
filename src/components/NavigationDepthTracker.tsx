"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Faza 7 ("dugme Nazad treba da ide dokle ima smisla"): BackButton je ranije
 * uvek zvao router.back() osim na "/" — ako je korisnik stigao direktno na
 * neku unutrašnju stranu (link iz maila, bookmark, nova kartica), "nazad" je
 * mogao da ga odvede VAN sajta (ili da ne uradi ništa). Da bismo znali da li
 * "nazad" uopšte ima gde da ide UNUTAR aplikacije, brojimo koliko puta se
 * pathname promenio u ovoj kartici/sesiji (sessionStorage — po tab, briše se
 * kad se kartica zatvori). Renderuje se jednom, u root layout-u; ne vraća
 * ništa vidljivo.
 */
export function NavigationDepthTracker() {
  const pathname = usePathname();
  const prevPathname = useRef<string | null>(null);

  useEffect(() => {
    if (prevPathname.current !== null && prevPathname.current !== pathname) {
      try {
        const current = Number(sessionStorage.getItem("rutaNavDepth") ?? "0");
        sessionStorage.setItem("rutaNavDepth", String(current + 1));
      } catch {
        // sessionStorage može da ne bude dostupan (privatni režim i sl.) —
        // BackButton se u tom slučaju bezbedno ponaša kao da nema istorije.
      }
    }
    prevPathname.current = pathname;
  }, [pathname]);

  return null;
}
