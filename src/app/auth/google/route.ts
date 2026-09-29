import { NextRequest, NextResponse } from "next/server";
import {
  buildGoogleAuthUrl,
  generateOAuthState,
  googleCredentialsConfigured,
  setOAuthStateCookie,
} from "@/lib/google-auth";

// Faza 20: početna tačka "Nastavi sa Google" dugmeta (i na /prijava i na
// /registracija — isti find-or-create tok radi za oba, vidi callback rutu).
export async function GET(req: NextRequest) {
  if (!googleCredentialsConfigured()) {
    return NextResponse.redirect(
      new URL("/prijava?greska=google_nepodesen", req.nextUrl.origin)
    );
  }

  const state = generateOAuthState();
  await setOAuthStateCookie(state);

  return NextResponse.redirect(buildGoogleAuthUrl(req.nextUrl.origin, state));
}
