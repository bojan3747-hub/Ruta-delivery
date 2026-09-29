import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import {
  consumeOAuthStateCookie,
  exchangeGoogleCode,
  setPendingGoogleProfile,
} from "@/lib/google-auth";
import {
  getUserByEmail,
  getUserByGoogleId,
  linkGoogleAccount,
} from "@/lib/queries/companies";

// Faza 20: Google preusmerava ovde sa `code` i `state` posle pristanka
// korisnika. Redosled provera:
// 1. postoji nalog sa ovim google_id → prijava (povratni korisnik).
// 2. postoji nalog sa ovim emailom (mejl/lozinka registracija ranije) → ako
//    je uloga CLIENT i Google email je verifikovan, poveži naloge i prijavi;
//    inače odbij (drugi tip naloga, ili neverifikovan email kod Google-a).
// 3. nema naloga → sačuvaj profil u kratkotrajan kolačić i pošalji na
//    /registracija/google da unese telefon i prihvati uslove pre kreiranja
//    naloga (isti obavezni podaci kao redovna registracija).
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const errorRedirect = (razlog: string) =>
    NextResponse.redirect(new URL(`/prijava?greska=${razlog}`, origin));

  const code = req.nextUrl.searchParams.get("code");
  const returnedState = req.nextUrl.searchParams.get("state");
  const expectedState = await consumeOAuthStateCookie();

  if (!code || !returnedState || !expectedState || returnedState !== expectedState) {
    return errorRedirect("google");
  }

  const profile = await exchangeGoogleCode(code, origin);
  if (!profile) {
    return errorRedirect("google");
  }

  const existingByGoogleId = await getUserByGoogleId(profile.sub);
  if (existingByGoogleId) {
    await createSession(existingByGoogleId.id, existingByGoogleId.role);
    return NextResponse.redirect(new URL("/klijent", origin));
  }

  const existingByEmail = await getUserByEmail(profile.email);
  if (existingByEmail) {
    if (existingByEmail.role !== "CLIENT") {
      return errorRedirect("google_email_zauzet");
    }
    if (!profile.email_verified) {
      return errorRedirect("google_email_nepotvrdjen");
    }
    const linked = await linkGoogleAccount(existingByEmail.id, profile.sub);
    await createSession(linked.id, linked.role);
    return NextResponse.redirect(new URL("/klijent", origin));
  }

  // Nov korisnik — profil čuvamo privremeno, nalog se kreira tek kad unese
  // telefon i prihvati uslove na /registracija/google.
  await setPendingGoogleProfile(profile);
  return NextResponse.redirect(new URL("/registracija/google", origin));
}
