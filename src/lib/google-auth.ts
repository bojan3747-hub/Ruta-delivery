import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";

// Faza 20: "Nastavi sa Google" za klijente — ručna implementacija OAuth 2.0
// Authorization Code flow-a (bez dodatne biblioteke poput NextAuth/Arctic,
// dosledno stilu ostatka projekta koji nema spoljne auth zavisnosti).
//
// Dva kratkotrajna httpOnly kolačića prate tok:
// - GOOGLE_STATE_COOKIE: nasumičan string, štiti od CSRF-a (upoređuje se sa
//   `state` parametrom koji Google vrati na callback).
// - GOOGLE_PENDING_COOKIE: čuva Google profil (sub/email/ime) između
//   callback-a i završetka registracije (kad nalog još ne postoji i treba
//   nam telefon + prihvatanje uslova pre kreiranja naloga) — vidi
//   /registracija/google.

const GOOGLE_STATE_COOKIE = "google_oauth_state";
const GOOGLE_PENDING_COOKIE = "google_pending_profile";
const SHORT_COOKIE_MAX_AGE_SECONDS = 60 * 10; // 10 minuta — dovoljno za ceo OAuth round-trip

export interface GoogleProfile {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
}

export function googleCredentialsConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/** Redirect URI mora biti IDENTIČAN u authorize i token-exchange koraku, i
 * mora biti registrovan u Google Cloud Console kao "Authorized redirect URI".
 * Izveden iz porekla trenutnog zahteva (radi i u sandbox-u na localhost i na
 * produkciji na ruta-dostava.rs bez posebnog env podešavanja), sa opcionim
 * override-om preko GOOGLE_REDIRECT_URI ako se ikad pokaže potrebnim. */
export function googleRedirectUri(origin: string): string {
  return process.env.GOOGLE_REDIRECT_URI || `${origin}/auth/google/callback`;
}

export function buildGoogleAuthUrl(origin: string, state: string): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID ?? "");
  url.searchParams.set("redirect_uri", googleRedirectUri(origin));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  // "select_account" umesto podrazumevanog — korisnik koji ima više Google
  // naloga bira kojim se prijavljuje, ne dobija automatski poslednji korišćen.
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export async function exchangeGoogleCode(
  code: string,
  origin: string
): Promise<GoogleProfile | null> {
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        redirect_uri: googleRedirectUri(origin),
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) return null;
    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (!tokenData.access_token) return null;

    const profileRes = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    if (!profileRes.ok) return null;
    const profile = (await profileRes.json()) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
    };
    if (!profile.sub || !profile.email) return null;

    return {
      sub: profile.sub,
      email: profile.email.toLowerCase(),
      email_verified: Boolean(profile.email_verified),
      name: profile.name || profile.email,
    };
  } catch {
    return null;
  }
}

export async function setOAuthStateCookie(state: string): Promise<void> {
  const jar = await cookies();
  jar.set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SHORT_COOKIE_MAX_AGE_SECONDS,
  });
}

/** Čita i odmah briše state kolačić — jednokratna upotreba po OAuth pokušaju. */
export async function consumeOAuthStateCookie(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(GOOGLE_STATE_COOKIE)?.value ?? null;
  jar.delete(GOOGLE_STATE_COOKIE);
  return value;
}

export function generateOAuthState(): string {
  return randomBytes(16).toString("hex");
}

export async function setPendingGoogleProfile(profile: GoogleProfile): Promise<void> {
  const jar = await cookies();
  jar.set(GOOGLE_PENDING_COOKIE, JSON.stringify(profile), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SHORT_COOKIE_MAX_AGE_SECONDS,
  });
}

export async function readPendingGoogleProfile(): Promise<GoogleProfile | null> {
  const jar = await cookies();
  const raw = jar.get(GOOGLE_PENDING_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as GoogleProfile;
    if (!parsed.sub || !parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function clearPendingGoogleProfile(): Promise<void> {
  const jar = await cookies();
  jar.delete(GOOGLE_PENDING_COOKIE);
}
