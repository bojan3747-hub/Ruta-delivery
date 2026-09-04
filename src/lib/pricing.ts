import type { CourierRow, ShipmentRow, ShipmentType } from "./types";
import { distanceKm } from "./zones";

// Assumed weight brackets per shipment type, used because the client form
// doesn't collect exact weight (KAN-5 asks for a shipment type, not kg).
const ASSUMED_WEIGHT_KG: Record<ShipmentType, number> = {
  DOKUMENT: 0.5,
  MALI_PAKET: 5,
  SREDNJI_PAKET: 15,
  VELIKI_PAKET: 40,
};

const HITNO_SURCHARGE = 1.2;
const HITNO_SPEEDUP = 0.7;

export interface AutoQuote {
  cenaEur: number;
  procenjenoVremeMin: number;
  distanceKm: number;
}

/**
 * Computes the automatic quote a given active courier would offer for a
 * standard shipment, based on their saved price list (KAN-8) and the
 * distance between pickup/drop-off zones. Returns null if the courier's
 * price list isn't fully configured yet.
 */
export function computeAutoQuote(
  courier: Pick<
    CourierRow,
    "cena_po_km" | "cena_po_kg" | "minimalna_cena"
  >,
  shipment: Pick<
    ShipmentRow,
    "zona_preuzimanja" | "zona_isporuke" | "tip" | "hitno"
  >
): AutoQuote | null {
  if (
    courier.cena_po_km == null ||
    courier.cena_po_kg == null ||
    courier.minimalna_cena == null
  ) {
    return null;
  }

  const cenaPoKm = Number(courier.cena_po_km);
  const cenaPoKg = Number(courier.cena_po_kg);
  const minimalnaCena = Number(courier.minimalna_cena);
  const km = distanceKm(shipment.zona_preuzimanja, shipment.zona_isporuke);
  const tezinaKg = ASSUMED_WEIGHT_KG[shipment.tip];

  let cena = Math.max(minimalnaCena, cenaPoKm * km + cenaPoKg * tezinaKg);
  let etaMin = 15 + km * 2.2;

  if (shipment.hitno) {
    cena *= HITNO_SURCHARGE;
    etaMin *= HITNO_SPEEDUP;
  }

  return {
    cenaEur: Math.round(cena * 100) / 100,
    procenjenoVremeMin: Math.round(etaMin),
    distanceKm: km,
  };
}
