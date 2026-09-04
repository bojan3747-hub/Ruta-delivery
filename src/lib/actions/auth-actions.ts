"use server";

import { redirect } from "next/navigation";
import { queryOne } from "../db";
import { createSession, destroySession, verifyPassword } from "../auth";
import { createCompanyAccount } from "../queries/companies";
import type { UserRow } from "../types";

export interface ActionState {
  error?: string;
  success?: boolean;
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

  const user = await queryOne<UserRow>("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
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
  const naziv = str(formData, "naziv");
  const pib = str(formData, "pib");
  const adresa = str(formData, "adresa");

  if (!email || !password || !ime || !telefon || !naziv) {
    return { error: "Popunite sva obavezna polja." };
  }
  if (password.length < 6) {
    return { error: "Lozinka mora imati bar 6 karaktera." };
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
    });
    userId = user.id;
  } catch {
    return { error: "Registracija nije uspela. Pokušajte ponovo." };
  }

  await createSession(userId, "CLIENT");
  redirect("/klijent");
}
