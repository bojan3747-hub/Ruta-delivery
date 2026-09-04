import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { queryOne } from "./db";
import type { Role, UserRow } from "./types";

const SESSION_COOKIE = "ruta_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    throw new Error("SESSION_SECRET nije podešen (proveri .env fajl)");
  }
  return value;
}

interface SessionPayload {
  sub: string;
  role: Role;
}

function sign(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function verify(token: string): SessionPayload | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Call only from a Server Action or Route Handler. */
export async function createSession(userId: string, role: Role): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, sign({ sub: userId, role }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/** Call only from a Server Action or Route Handler. */
export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verify(token);
}

export interface CurrentUser extends UserRow {
  companyId: string | null;
  courierId: string | null;
}

/** Reads the session cookie and re-fetches the user row so role/profile stay fresh. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await queryOne<UserRow>("SELECT * FROM users WHERE id = $1", [
    session.sub,
  ]);
  if (!user) return null;

  const company = await queryOne<{ id: string }>(
    "SELECT id FROM companies WHERE user_id = $1",
    [user.id]
  );
  const courier = await queryOne<{ id: string }>(
    "SELECT id FROM couriers WHERE user_id = $1",
    [user.id]
  );

  return { ...user, companyId: company?.id ?? null, courierId: courier?.id ?? null };
}

const ROLE_HOME: Record<Role, string> = {
  CLIENT: "/klijent",
  COURIER: "/dostavljac",
  OPERATOR: "/operater",
};

/** Use at the top of a role-guarded layout/page. Redirects away if the role doesn't match. */
export async function requireUser(role: Role): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/prijava");
  if (user.role !== role) redirect(ROLE_HOME[user.role]);
  return user;
}
