import { query, queryOne } from "../db";
import type { SavedAddressRow, Zone } from "../types";

export async function listSavedAddresses(
  companyId: string
): Promise<SavedAddressRow[]> {
  return query<SavedAddressRow>(
    "SELECT * FROM saved_addresses WHERE company_id = $1 ORDER BY naziv ASC",
    [companyId]
  );
}

export async function createSavedAddress(input: {
  companyId: string;
  naziv: string;
  adresa: string;
  zona: Zone;
}): Promise<void> {
  await query(
    `INSERT INTO saved_addresses (company_id, naziv, adresa, zona)
     VALUES ($1, $2, $3, $4)`,
    [input.companyId, input.naziv, input.adresa, input.zona]
  );
}

export async function deleteSavedAddress(
  id: string,
  companyId: string
): Promise<void> {
  const row = await queryOne<{ id: string }>(
    "DELETE FROM saved_addresses WHERE id = $1 AND company_id = $2 RETURNING id",
    [id, companyId]
  );
  if (!row) throw new Error("Adresa nije pronađena.");
}
