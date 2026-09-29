"use server";

import { redirect } from "next/navigation";
import { queryOne } from "../db";
import { createSession, destroySession, verifyPassword } from "../auth";
import { createCompanyAccount, createGoogleClientAccount } from "../queries/companies";
import { requestPasswordReset, resetPassword } from "../queries/password-reset";
import {
  clearPendingGoogleProfile,
  readPendingGoogleProfile,
} from "../google-auth";
import { isValidEmail, isValidPhone, isValidPib, isTooLong, MAX_NAME_LEN } from "../validation";
import { CLIENT_TYPE_LABELS } from "../labels";
import type { UserRow } from "../types";

export interface ActionState {
  error?: string;
  success?: boolean;
  message?: string;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = str(formData, "email").toLowerCase();
  const password = str(formData, "password");

  if (!email || !password) {
    return { error: "Unesite email i lozinku." };
  }
  if (!isValidEmail(email)) {
    return { error: "Unesite validnu email adresu." };
  }

  const user = await queryOne<UserRow>("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  // Faza 20: nalog kreiran preko Google-a nema password_hash — jasna poruka
  // umesto generičke "pogrešan email ili lozinka" (i umesto da se
  // verifyPassword pozove sa null hash-om).
  if (user && !user.password_hash) {
    return {
      error:
        "Ovaj nalog je kreiran preko Google naloga — koristite dugme \"Nastavi sa Google\" ispod.",
    };
  }
  if (!user || !user.password_hash || !(await verifyPassword(password, user.password_hash))) {
    return { error: "Pogrešan email ili lozinka." };
  }

  await createSession(user.id, user.role);

  const destination =
    user.role === "CLIENT"
      ? "/klijent"
      : user.role === "COURIER"
        ? "/dostavljac"
        : "/operater";
  redirect(destination);
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

export async function registerClientAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = str(formData, "email").toLowerCase();
  const password = str(formData, "password");
  const ime = str(formData, "ime");
  const telefon = str(formData, "telefon");
  const adresa = str(formData, "adresa");
  const uslovi = formData.get("uslovi") === "on";

  // Faza 19a: klijent bira "Firma" ili "Fizičko lice" na formi; podrazumevano
  // FIRMA (stara forma nije menjala ovo polje) radi kompatibilnosti.
  const tipKlijentaRaw = str(formData, "tipKlijenta") || "FIRMA";
  if (!(tipKlijentaRaw in CLIENT_TYPE_LABELS)) {
    return { error: "Nepoznat tip naloga." };
  }
  const tipKlijenta = tipKlijentaRaw as keyof typeof CLIENT_TYPE_LABELS;
  const isFizickoLice = tipKlijenta === "FIZICKO_LICE";

  // Fizičko lice nema poseban naziv firme ni PIB — "naziv" na companies
  // (obavezno NOT NULL polje u šemi) se u tom slučaju popunjava imenom i
  // prezimenom kontakt osobe, a PIB se ignoriše čak i ako je nekako poslat.
  const naziv = isFizickoLice ? ime : str(formData, "naziv");
  const pib = isFizickoLice ? "" : str(formData, "pib");

  if (!email || !password || !ime || !telefon || !naziv) {
    return { error: "Popunite sva obavezna polja." };
  }
  if (!isValidEmail(email)) {
    return { error: "Unesite validnu email adresu." };
  }
  if (!isValidPhone(telefon)) {
    return { error: "Unesite validan broj telefona." };
  }
  if (pib && !isValidPib(pib)) {
    return { error: "PIB mora imati tačno 8 cifara." };
  }
  if (
    isTooLong(ime, MAX_NAME_LEN) ||
    isTooLong(naziv, MAX_NAME_LEN) ||
    isTooLong(adresa, MAX_NAME_LEN)
  ) {
    return { error: "Uneti tekst je predugačak." };
  }
  if (password.length < 6) {
    return { error: "Lozinka mora imati bar 6 karaktera." };
  }
  if (!uslovi) {
    return { error: "Morate prihvatiti Opšte uslove korišćenja." };
  }

  const existing = await queryOne("SELECT id FROM users WHERE email = $1", [
    email,
  ]);
  if (existing) {
    return { error: "Nalog sa ovim emailom već postoji." };
  }

  let userId: string;
  try {
    const { user } = await createCompanyAccount({
      email,
      password,
      ime,
      telefon,
      naziv,
      pib: pib || undefined,
      adresa: adresa || undefined,
      tipKlijenta,
    });
    userId = user.id;
  } catch {
    return { error: "Registracija nije uspela. Pokušajte ponovo." };
  }

  await createSession(userId, "CLIENT");
  redirect("/klijent");
}

// Faza 20: završni korak Google registracije — profil (ime/email/google_id)
// već čeka u kratkotrajnom kolačiću (vidi /auth/google/callback), ovde se
// samo traži telefon i prihvatanje uslova pre nego što se nalog stvarno
// kreira (isti obavezni podaci kao redovna registracija, minus
// lozinka/naziv koji dolaze iz Google profila).
export async function completeGoogleRegistrationAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await readPendingGoogleProfile();
  if (!profile) {
    return {
      error: "Sesija za Google registraciju je istekla. Pokušajte ponovo.",
    };
  }

  const telefon = str(formData, "telefon");
  const uslovi = formData.get("uslovi") === "on";

  if (!telefon) return { error: "Unesite broj telefona." };
  if (!isValidPhone(telefon)) return { error: "Unesite validan broj telefona." };
  if (!uslovi) return { error: "Morate prihvatiti Opšte uslove korišćenja." };

  const existing = await queryOne("SELECT id FROM users WHERE email = $1", [
    profile.email,
  ]);
  if (existing) {
    // Neko se registrovao (drugim putem) u međuvremenu dok je Google
    // registracija bila u toku — redak slučaj, ali provera je jeftina.
    await clearPendingGoogleProfile();
    return { error: "Nalog sa ovim emailom već postoji. Prijavite se." };
  }

  let userId: string;
  try {
    const { user } = await createGoogleClientAccount({
      googleId: profile.sub,
      email: profile.email,
      ime: profile.name,
      telefon,
    });
    userId = user.id;
  } catch {
    return { error: "Registracija nije uspela. Pokušajte ponovo." };
  }

  await clearPendingGoogleProfile();
  await createSession(userId, "CLIENT");
  redirect("/klijent");
}

export async function requestPasswordResetAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = str(formData, "email").toLowerCase();
  if (!email) return { error: "Unesite email." };
  if (!isValidEmail(email)) return { error: "Unesite validnu email adresu." };

  await requestPasswordReset(email);

  // Namerno ista poruka bez obzira da li nalog postoji (da se ne otkriva
  // koji su emailovi registrovani). Pošto još nema slanja mejla, link za
  // reset operater vidi u /operater/reset-lozinke i prosleđuje ga korisniku.
  return {
    success: true,
    message:
      "Ako nalog sa ovim emailom postoji, zahtev je zabeležen — kontaktiraćemo vas uskoro na broj telefona koji imamo u sistemu.",
  };
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const token = str(formData, "token");
  const password = str(formData, "password");

  if (!token) return { error: "Nevažeći link." };
  if (password.length < 6) {
    return { error: "Lozinka mora imati bar 6 karaktera." };
  }

  try {
    await resetPassword(token, password);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Greška." };
  }

  redirect("/prijava?resetovano=1");
}
