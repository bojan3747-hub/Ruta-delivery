import { pool, query, queryOne } from "../db";
import { hashPassword } from "../auth";
import type { ClientType, CompanyRow, UserRow } from "../types";

export async function createCompanyAccount(input: {
  email: string;
  password: string;
  ime: string;
  telefon: string;
  naziv: string;
  pib?: string;
  adresa?: string;
  // Faza 19a: podrazumevano 'FIRMA' radi kompatibilnosti sa postojećim
  // pozivima ove funkcije (npr. skriptama).
  tipKlijenta?: ClientType;
}): Promise<{ user: UserRow; company: CompanyRow }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const passwordHash = await hashPassword(input.password);
    const userResult = await client.query<UserRow>(
      `INSERT INTO users (email, password_hash, role, ime, telefon, uslovi_prihvaceni_at)
       VALUES ($1, $2, 'CLIENT', $3, $4, now())
       RETURNING *`,
      [input.email.toLowerCase().trim(), passwordHash, input.ime, input.telefon]
    );
    const user = userResult.rows[0];

    const companyResult = await client.query<CompanyRow>(
      `INSERT INTO companies (user_id, naziv, pib, adresa, tip_klijenta)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        user.id,
        input.naziv,
        input.pib ?? null,
        input.adresa ?? null,
        input.tipKlijenta ?? "FIRMA",
      ]
    );

    await client.query("COMMIT");
    return { user, company: companyResult.rows[0] };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getCompanyById(id: string): Promise<CompanyRow | null> {
  return queryOne<CompanyRow>("SELECT * FROM companies WHERE id = $1", [id]);
}

// --- Faza 20: Google SSO (samo klijenti) -----------------------------------

export async function getUserByGoogleId(googleId: string): Promise<UserRow | null> {
  return queryOne<UserRow>("SELECT * FROM users WHERE google_id = $1", [googleId]);
}

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  return queryOne<UserRow>("SELECT * FROM users WHERE email = $1", [
    email.toLowerCase().trim(),
  ]);
}

/** Povezuje Google nalog sa postojećim korisnikom (prijavljenim ranije
 * mejlom/lozinkom) — poziva se samo kad je email kod Google-a verifikovan i
 * postojeći nalog ima ulogu CLIENT (vidi auth-actions/callback rutu za
 * potpunu logiku i razloge tih provera). */
export async function linkGoogleAccount(
  userId: string,
  googleId: string
): Promise<UserRow> {
  const result = await pool.query<UserRow>(
    "UPDATE users SET google_id = $1 WHERE id = $2 RETURNING *",
    [googleId, userId]
  );
  return result.rows[0];
}

/** Kreira NOVI klijentski nalog preko Google-a — uvek fizičko lice (Google
 * profil je uvek osoba, ne firma), bez lozinke. Isti obrazac transakcije kao
 * createCompanyAccount, samo password_hash ostaje NULL i google_id se
 * postavlja umesto toga. */
export async function createGoogleClientAccount(input: {
  googleId: string;
  email: string;
  ime: string;
  telefon: string;
}): Promise<{ user: UserRow; company: CompanyRow }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const userResult = await client.query<UserRow>(
      `INSERT INTO users (email, password_hash, role, ime, telefon, uslovi_prihvaceni_at, google_id)
       VALUES ($1, NULL, 'CLIENT', $2, $3, now(), $4)
       RETURNING *`,
      [input.email.toLowerCase().trim(), input.ime, input.telefon, input.googleId]
    );
    const user = userResult.rows[0];

    const companyResult = await client.query<CompanyRow>(
      `INSERT INTO companies (user_id, naziv, tip_klijenta)
       VALUES ($1, $2, 'FIZICKO_LICE')
       RETURNING *`,
      [user.id, input.ime]
    );

    await client.query("COMMIT");
    return { user, company: companyResult.rows[0] };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export interface CompanyForOperator extends CompanyRow {
  /** Faza 7: operater treba da vidi listu registrovanih klijenata sa svim
   * podacima koje klijent unese pri registraciji — deo tih podataka
   * (kontakt ime/telefon, email) živi na `users`, ne na `companies`. */
  kontakt_ime: string;
  kontakt_telefon: string | null;
  kontakt_email: string;
}

export async function listCompaniesForOperator(): Promise<CompanyForOperator[]> {
  return query<CompanyForOperator>(
    `SELECT comp.*, u.ime AS kontakt_ime, u.telefon AS kontakt_telefon, u.email AS kontakt_email
     FROM companies comp
     JOIN users u ON u.id = comp.user_id
     ORDER BY comp.created_at DESC`
  );
}
