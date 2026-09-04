import { Pool } from "pg";

// A single pg Pool, reused across hot-reloads in dev (Next.js re-evaluates
// modules on every request in dev mode otherwise, which would exhaust
// Postgres connections quickly).
declare global {
  var __rutaPool: Pool | undefined;
}

export const pool =
  global.__rutaPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  global.__rutaPool = pool;
}

export async function query<T = unknown>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = unknown>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
