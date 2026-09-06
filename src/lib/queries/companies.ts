import { pool, queryOne } from "../db";
import { hashPassword } from "../auth";
import type { CompanyRow, UserRow } from "../types";

export async function createCompanyAccount(input: {
  email: string;
  password: string;
  ime: string;
  telefon: string;
  naziv: string;
  pib?: string;
  adresa?: string;
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
      `INSERT INTO companies (user_id, naziv, pib, adresa)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user.id, input.naziv, input.pib ?? null, input.adresa ?? null]
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
