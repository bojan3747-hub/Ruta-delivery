import { pool, query, queryOne } from "../db";
import { hashPassword } from "../auth";
import type { CourierRow, UserRow, Zone } from "../types";

export async function createPreApprovedCourier(input: {
  naziv: string;
  telefon: string;
  izvorKontakta: string;
}): Promise<CourierRow> {
  const row = await queryOne<CourierRow>(
    `INSERT INTO couriers (naziv, telefon, izvor_kontakta, status)
     VALUES ($1, $2, $3, 'NA_POTVRDI')
     RETURNING *`,
    [input.naziv, input.telefon, input.izvorKontakta]
  );
  if (!row) throw new Error("Kreiranje dostavljača nije uspelo");
  return row;
}

export async function listCouriersForOperator(): Promise<CourierRow[]> {
  return query<CourierRow>("SELECT * FROM couriers ORDER BY created_at DESC");
}

export async function getCourierByToken(
  token: string
): Promise<CourierRow | null> {
  return queryOne<CourierRow>(
    "SELECT * FROM couriers WHERE aktivacioni_token = $1",
    [token]
  );
}

export async function getCourierById(id: string): Promise<CourierRow | null> {
  return queryOne<CourierRow>("SELECT * FROM couriers WHERE id = $1", [id]);
}

export async function getCourierByUserId(
  userId: string
): Promise<CourierRow | null> {
  return queryOne<CourierRow>("SELECT * FROM couriers WHERE user_id = $1", [
    userId,
  ]);
}

export async function getCourierZones(courierId: string): Promise<Zone[]> {
  const rows = await query<{ zone: Zone }>(
    "SELECT zone FROM courier_zones WHERE courier_id = $1",
    [courierId]
  );
  return rows.map((r) => r.zone);
}

export async function activateCourier(input: {
  courierId: string;
  email: string;
  password: string;
  telefon: string;
  pib: string;
  tipVozila: string;
  nosivostKg: number;
  zones: Zone[];
}): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const passwordHash = await hashPassword(input.password);
    const courier = await client.query<CourierRow>(
      "SELECT * FROM couriers WHERE id = $1 FOR UPDATE",
      [input.courierId]
    );
    if (!courier.rows[0]) throw new Error("Dostavljač nije pronađen");
    if (courier.rows[0].status === "AKTIVAN") {
      throw new Error("Ovaj nalog je već aktiviran");
    }

    const userResult = await client.query<UserRow>(
      `INSERT INTO users (email, password_hash, role, ime, telefon, uslovi_prihvaceni_at)
       VALUES ($1, $2, 'COURIER', $3, $4, now())
       RETURNING *`,
      [
        input.email.toLowerCase().trim(),
        passwordHash,
        courier.rows[0].naziv,
        input.telefon,
      ]
    );

    await client.query(
      `UPDATE couriers
       SET user_id = $1, email = $2, telefon = $3, pib = $4,
           tip_vozila = $5, nosivost_kg = $6, status = 'AKTIVAN'
       WHERE id = $7`,
      [
        userResult.rows[0].id,
        input.email.toLowerCase().trim(),
        input.telefon,
        input.pib,
        input.tipVozila,
        input.nosivostKg,
        input.courierId,
      ]
    );

    for (const zone of input.zones) {
      await client.query(
        `INSERT INTO courier_zones (courier_id, zone)
         VALUES ($1, $2)
         ON CONFLICT (courier_id, zone) DO NOTHING`,
        [input.courierId, zone]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function updateCourierPricing(
  courierId: string,
  input: {
    cenaPoKm: number;
    cenaPoKg: number;
    minimalnaCena: number;
    dnevniKapacitet: number;
    zones: Zone[];
  }
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE couriers
       SET cena_po_km = $1, cena_po_kg = $2, minimalna_cena = $3, dnevni_kapacitet = $4
       WHERE id = $5`,
      [
        input.cenaPoKm,
        input.cenaPoKg,
        input.minimalnaCena,
        input.dnevniKapacitet,
        courierId,
      ]
    );
    await client.query("DELETE FROM courier_zones WHERE courier_id = $1", [
      courierId,
    ]);
    for (const zone of input.zones) {
      await client.query(
        "INSERT INTO courier_zones (courier_id, zone) VALUES ($1, $2)",
        [courierId, zone]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** Active couriers covering both zones with free daily capacity today. */
export async function findEligibleActiveCouriers(
  zonaPreuzimanja: Zone,
  zonaIsporuke: Zone
): Promise<CourierRow[]> {
  return query<CourierRow>(
    `SELECT c.* FROM couriers c
     WHERE c.status = 'AKTIVAN'
       AND c.dostupan = true
       AND c.cena_po_km IS NOT NULL
       AND EXISTS (SELECT 1 FROM courier_zones cz WHERE cz.courier_id = c.id AND cz.zone = $1)
       AND EXISTS (SELECT 1 FROM courier_zones cz WHERE cz.courier_id = c.id AND cz.zone = $2)
       AND (
         SELECT COUNT(*) FROM orders o
         WHERE o.courier_id = c.id
           AND o.status NOT IN ('ISPORUCENO', 'OTKAZANO')
           AND o.created_at::date = now()::date
       ) < c.dnevni_kapacitet
     ORDER BY c.cena_po_km ASC`,
    [zonaPreuzimanja, zonaIsporuke]
  );
}

/** Active, available couriers covering both zones, regardless of pricing/capacity (used for manual/non-standard requests). */
export async function findCouriersCoveringZones(
  zonaPreuzimanja: Zone,
  zonaIsporuke: Zone
): Promise<CourierRow[]> {
  return query<CourierRow>(
    `SELECT c.* FROM couriers c
     WHERE c.status = 'AKTIVAN'
       AND c.dostupan = true
       AND EXISTS (SELECT 1 FROM courier_zones cz WHERE cz.courier_id = c.id AND cz.zone = $1)
       AND EXISTS (SELECT 1 FROM courier_zones cz WHERE cz.courier_id = c.id AND cz.zone = $2)`,
    [zonaPreuzimanja, zonaIsporuke]
  );
}

/** Operator suspends or reactivates a courier; only toggles between AKTIVAN and SUSPENDOVAN. */
export async function setCourierStatus(
  courierId: string,
  status: "AKTIVAN" | "SUSPENDOVAN"
): Promise<void> {
  const courier = await getCourierById(courierId);
  if (!courier) throw new Error("Dostavljač nije pronađen");
  if (courier.status === "NA_POTVRDI") {
    throw new Error("Nalog još nije aktiviran.");
  }
  await query("UPDATE couriers SET status = $1 WHERE id = $2", [
    status,
    courierId,
  ]);
}

/** Courier pauses/resumes receiving new offers without deactivating the account. */
export async function setCourierAvailability(
  courierId: string,
  dostupan: boolean
): Promise<void> {
  await query("UPDATE couriers SET dostupan = $1 WHERE id = $2", [
    dostupan,
    courierId,
  ]);
}
