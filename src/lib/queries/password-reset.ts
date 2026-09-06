import { pool, query, queryOne } from "../db";
import { hashPassword } from "../auth";
import type { UserRow } from "../types";

const RESET_TOKEN_TTL_HOURS = 1;

/**
 * Requests a password reset for the given email. Always succeeds silently
 * even if no account matches (prevents leaking which emails are
 * registered) — the caller should show a generic confirmation either way.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  await pool.query(
    `UPDATE users
     SET reset_token = gen_random_uuid(),
         reset_token_expires_at = now() + interval '${RESET_TOKEN_TTL_HOURS} hours'
     WHERE email = $1`,
    [email.toLowerCase().trim()]
  );
}

export async function getUserByResetToken(token: string): Promise<UserRow | null> {
  return queryOne<UserRow>(
    `SELECT * FROM users
     WHERE reset_token = $1::uuid AND reset_token_expires_at > now()`,
    [token]
  );
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<void> {
  const user = await getUserByResetToken(token);
  if (!user) throw new Error("Link za resetovanje lozinke je nevažeći ili je istekao.");

  const passwordHash = await hashPassword(newPassword);
  await pool.query(
    `UPDATE users
     SET password_hash = $1, reset_token = NULL, reset_token_expires_at = NULL
     WHERE id = $2`,
    [passwordHash, user.id]
  );
}

export interface PendingReset {
  id: string;
  email: string;
  ime: string;
  telefon: string | null;
  role: string;
  reset_token: string;
  reset_token_expires_at: string;
}

export async function listPendingPasswordResets(): Promise<PendingReset[]> {
  return query<PendingReset>(
    `SELECT id, email, ime, telefon, role, reset_token, reset_token_expires_at
     FROM users
     WHERE reset_token IS NOT NULL AND reset_token_expires_at > now()
     ORDER BY reset_token_expires_at ASC`
  );
}
