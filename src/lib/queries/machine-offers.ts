import { query, queryOne } from "../db";
import type { MachineOfferRow } from "../types";

// Faza 19d: ručne ponude provajdera za angažovanje mašine — isti obrazac
// kao queries/offers.ts (za pošiljke), samo za machine_requests.

export interface MachineOfferWithCourier extends MachineOfferRow {
  courier_naziv: string;
  courier_ocena_prosek: string | null;
  courier_verifikovan: boolean;
}

export async function createManualMachineOffer(input: {
  machineRequestId: string;
  courierId: string;
  cena: number;
  procenaTrajanja: string;
  napomena?: string;
}): Promise<MachineOfferRow> {
  const row = await queryOne<MachineOfferRow>(
    `INSERT INTO machine_offers (machine_request_id, courier_id, cena, procena_trajanja, napomena, status)
     VALUES ($1, $2, $3, $4, $5, 'POSLATA')
     ON CONFLICT (machine_request_id, courier_id)
     DO UPDATE SET cena = EXCLUDED.cena, procena_trajanja = EXCLUDED.procena_trajanja,
                    napomena = EXCLUDED.napomena, status = 'POSLATA'
     RETURNING *`,
    [
      input.machineRequestId,
      input.courierId,
      input.cena,
      input.procenaTrajanja,
      input.napomena ?? null,
    ]
  );
  if (!row) throw new Error("Slanje ponude nije uspelo");
  return row;
}

export async function listOffersForMachineRequest(
  machineRequestId: string
): Promise<MachineOfferWithCourier[]> {
  return query<MachineOfferWithCourier>(
    `SELECT o.*, c.naziv AS courier_naziv, c.ocena_prosek AS courier_ocena_prosek,
            c.verifikovan AS courier_verifikovan
     FROM machine_offers o
     JOIN couriers c ON c.id = o.courier_id
     WHERE o.machine_request_id = $1 AND o.status = 'POSLATA'
     ORDER BY o.cena ASC`,
    [machineRequestId]
  );
}

export async function getMachineOfferForCourier(
  machineRequestId: string,
  courierId: string
): Promise<MachineOfferRow | null> {
  return queryOne<MachineOfferRow>(
    "SELECT * FROM machine_offers WHERE machine_request_id = $1 AND courier_id = $2",
    [machineRequestId, courierId]
  );
}

export async function getMachineOfferById(
  id: string
): Promise<MachineOfferRow | null> {
  return queryOne<MachineOfferRow>("SELECT * FROM machine_offers WHERE id = $1", [
    id,
  ]);
}
