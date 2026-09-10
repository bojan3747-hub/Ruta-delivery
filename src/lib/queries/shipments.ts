import { pool, query, queryOne } from "../db";
import type {
  OrderStatus,
  ShipmentContentType,
  ShipmentRow,
  ShipmentStatus,
  ShipmentType,
  SpecialCargoType,
  TerminType,
  Zone,
} from "../types";

export async function createShipment(input: {
  clientId: string;
  zonaPreuzimanja: Zone;
  zonaIsporuke: Zone;
  adresaPreuzimanja: string;
  adresaIsporuke: string;
  posiljalacIme?: string;
  posiljalacTelefon?: string;
  primalacIme?: string;
  primalacTelefon?: string;
  tip: ShipmentType;
  sadrzajPosiljke: ShipmentContentType;
  posebnaKategorijaTereta?: SpecialCargoType;
  hitno: boolean;
  nestandardna: boolean;
  zeljeniTermin: TerminType;
  terminDetalji?: string;
  napomena?: string;
  deklarisanaVrednost: number;
  // Prava ruta (Mapbox), best-effort — vidi src/lib/geocode.ts. Kad
  // geokodiranje/ruting ne uspe, sve ostaje undefined/null i cena/ETA
  // padaju nazad na procenu po zonama (src/lib/pricing.ts).
  preuzimanjeLat?: number;
  preuzimanjeLon?: number;
  isporukaLat?: number;
  isporukaLon?: number;
  udaljenostKm?: number;
}): Promise<ShipmentRow> {
  const row = await queryOne<ShipmentRow>(
    `INSERT INTO shipments (
       client_id, zona_preuzimanja, zona_isporuke, adresa_preuzimanja,
       adresa_isporuke, posiljalac_ime, posiljalac_telefon, primalac_ime,
       primalac_telefon, tip, sadrzaj_posiljke, posebna_kategorija_tereta,
       hitno, nestandardna, zeljeni_termin, termin_detalji, napomena,
       deklarisana_vrednost, preuzimanje_lat, preuzimanje_lon, isporuka_lat,
       isporuka_lon, udaljenost_km
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,
               $19,$20,$21,$22,$23)
     RETURNING *`,
    [
      input.clientId,
      input.zonaPreuzimanja,
      input.zonaIsporuke,
      input.adresaPreuzimanja,
      input.adresaIsporuke,
      input.posiljalacIme ?? null,
      input.posiljalacTelefon ?? null,
      input.primalacIme ?? null,
      input.primalacTelefon ?? null,
      input.tip,
      input.sadrzajPosiljke,
      input.posebnaKategorijaTereta ?? null,
      input.hitno,
      input.nestandardna,
      input.zeljeniTermin,
      input.terminDetalji ?? null,
      input.napomena ?? null,
      input.deklarisanaVrednost,
      input.preuzimanjeLat ?? null,
      input.preuzimanjeLon ?? null,
      input.isporukaLat ?? null,
      input.isporukaLon ?? null,
      input.udaljenostKm ?? null,
    ]
  );
  if (!row) throw new Error("Kreiranje pošiljke nije uspelo");
  return row;
}

export async function getShipmentById(
  id: string
): Promise<ShipmentRow | null> {
  return queryOne<ShipmentRow>("SELECT * FROM shipments WHERE id = $1", [id]);
}

export async function listShipmentsByClient(
  clientId: string
): Promise<ShipmentRow[]> {
  return query<ShipmentRow>(
    "SELECT * FROM shipments WHERE client_id = $1 ORDER BY created_at DESC",
    [clientId]
  );
}

export interface ShipmentExportRow extends ShipmentRow {
  order_cena: string | null;
  order_status: OrderStatus | null;
  courier_naziv: string | null;
}

/**
 * Sve pošiljke klijenta, sa cenom/dostavljačem iz porudžbine kad postoji
 * (LEFT JOIN — pošiljka bez izabrane ponude i dalje mora da se izveze).
 * Koristi se za izvoz istorije pošiljki u Excel (KAN: "izvezi u Excel").
 */
export async function listShipmentsForExport(
  clientId: string,
  status?: ShipmentStatus
): Promise<ShipmentExportRow[]> {
  const params: unknown[] = [clientId];
  let statusClause = "";
  if (status) {
    params.push(status);
    statusClause = ` AND s.status = $${params.length}`;
  }
  return query<ShipmentExportRow>(
    `SELECT s.*, o.cena AS order_cena, o.status AS order_status,
            c.naziv AS courier_naziv
     FROM shipments s
     LEFT JOIN orders o ON o.shipment_id = s.id
     LEFT JOIN couriers c ON c.id = o.courier_id
     WHERE s.client_id = $1${statusClause}
     ORDER BY s.created_at DESC`,
    params
  );
}

export async function updateShipmentStatus(
  id: string,
  status: ShipmentStatus
): Promise<void> {
  await query("UPDATE shipments SET status = $1 WHERE id = $2", [status, id]);
}

/**
 * Client cancels their own shipment — only allowed before a courier has
 * been chosen (no order exists yet). Once an order exists, cancelOrder
 * (in queries/orders.ts) is the right call instead.
 */
export async function cancelShipment(
  shipmentId: string,
  clientId: string
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const res = await client.query<ShipmentRow>(
      "SELECT * FROM shipments WHERE id = $1 FOR UPDATE",
      [shipmentId]
    );
    const shipment = res.rows[0];
    if (!shipment) throw new Error("Pošiljka nije pronađena");
    if (shipment.client_id !== clientId) {
      throw new Error("Nemate pravo da otkažete ovu pošiljku");
    }
    if (shipment.status !== "OTVORENA" && shipment.status !== "PONUDE_STIGLE") {
      throw new Error("Pošiljka se više ne može otkazati u ovom statusu");
    }

    await client.query("UPDATE shipments SET status = 'OTKAZANA' WHERE id = $1", [
      shipmentId,
    ]);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export const MANUAL_REQUEST_WINDOW_MINUTES = 15;

export interface OpenRequestForCourier extends ShipmentRow {
  /** Faza 7: ime firme klijenta, vidljivo dostavljaču od trenutka zahteva
   * (ranije se videlo tek u istoriji završenih porudžbina). */
  client_naziv: string;
}

/**
 * Open shipments a courier can still send an offer for (Faza 4): every
 * standard shipment stays visible until someone offers (no deadline —
 * we don't want a shipment to silently become unreachable), while
 * non-standard shipments keep the original 15-minute response window
 * (KAN-9). Either way: must cover both zones, the courier hasn't already
 * responded, and the shipment hasn't already been assigned.
 */
export async function listOpenRequestsForCourier(
  courierId: string
): Promise<OpenRequestForCourier[]> {
  return query<OpenRequestForCourier>(
    `SELECT s.*, comp.naziv AS client_naziv
     FROM shipments s
     JOIN companies comp ON comp.id = s.client_id
     WHERE s.status = 'OTVORENA'
       AND (
         s.nestandardna = false
         OR s.created_at > now() - interval '${MANUAL_REQUEST_WINDOW_MINUTES} minutes'
       )
       AND EXISTS (SELECT 1 FROM courier_zones cz WHERE cz.courier_id = $1 AND cz.zone = s.zona_preuzimanja)
       AND EXISTS (SELECT 1 FROM courier_zones cz WHERE cz.courier_id = $1 AND cz.zone = s.zona_isporuke)
       AND NOT EXISTS (
         SELECT 1 FROM offers o WHERE o.shipment_id = s.id AND o.courier_id = $1
       )
     ORDER BY s.created_at ASC`,
    [courierId]
  );
}
