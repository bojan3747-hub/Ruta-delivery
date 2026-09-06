// Mirrors db/schema.sql. Kept hand-written because Prisma's engine can't be
// downloaded inside this sandbox (see the note at the top of db/schema.sql);
// prisma/schema.prisma has the same shape for use once the project runs
// somewhere with normal internet access.

export type Role = "CLIENT" | "COURIER" | "OPERATOR";

export type Zone =
  | "STARI_GRAD"
  | "VRACAR"
  | "SAVSKI_VENAC"
  | "NOVI_BEOGRAD"
  | "ZEMUN"
  | "ZVEZDARA"
  | "VOZDOVAC"
  | "CUKARICA"
  | "PALILULA"
  | "RAKOVICA";

export type VehicleType = "MOTOR" | "PUTNICKO_VOZILO" | "KOMBI" | "KAMION";

export type CourierStatus = "NA_POTVRDI" | "AKTIVAN";

export type ShipmentType =
  | "DOKUMENT"
  | "MALI_PAKET"
  | "SREDNJI_PAKET"
  | "VELIKI_PAKET";

export type TerminType = "ODMAH" | "DANAS_DO" | "ZAKAZANO";

export type ShipmentStatus =
  | "OTVORENA"
  | "PONUDE_STIGLE"
  | "IZABRANA"
  | "ZAVRSENA"
  | "OTKAZANA";

export type OfferType = "AUTOMATSKA" | "RUCNA";

export type OfferStatus = "POSLATA" | "PRIHVACENA" | "ODBIJENA" | "ISTEKLA";

export type OrderStatus =
  | "PREUZETO"
  | "U_TRANZITU"
  | "NA_ISPORUCI"
  | "ISPORUCENO"
  | "OTKAZANO";

export type InvoiceStatus = "NEPLACENO" | "NAPLACENO" | "NEUSPESNO";

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  role: Role;
  ime: string;
  telefon: string | null;
  uslovi_prihvaceni_at: string | null;
  reset_token: string | null;
  reset_token_expires_at: string | null;
  created_at: string;
}

export interface CompanyRow {
  id: string;
  user_id: string;
  naziv: string;
  pib: string | null;
  adresa: string | null;
  created_at: string;
}

export interface CourierRow {
  id: string;
  user_id: string | null;
  naziv: string;
  telefon: string;
  email: string | null;
  pib: string | null;
  tip_vozila: VehicleType | null;
  nosivost_kg: string | null;
  cena_po_km: string | null;
  cena_po_kg: string | null;
  minimalna_cena: string | null;
  dnevni_kapacitet: number;
  status: CourierStatus;
  izvor_kontakta: string | null;
  ocena_prosek: string | null;
  broj_ocena: number;
  aktivacioni_token: string;
  payment_customer_token: string | null;
  created_at: string;
}

export interface CourierZoneRow {
  id: string;
  courier_id: string;
  zone: Zone;
}

export interface ShipmentRow {
  id: string;
  client_id: string;
  zona_preuzimanja: Zone;
  zona_isporuke: Zone;
  adresa_preuzimanja: string;
  adresa_isporuke: string;
  tip: ShipmentType;
  hitno: boolean;
  nestandardna: boolean;
  zeljeni_termin: TerminType;
  termin_detalji: string | null;
  napomena: string | null;
  fotografija_url: string | null;
  deklarisana_vrednost: string | null;
  status: ShipmentStatus;
  created_at: string;
}

export interface OfferRow {
  id: string;
  shipment_id: string;
  courier_id: string;
  cena: string;
  procenjeno_vreme_min: number;
  napomena: string | null;
  tip: OfferType;
  status: OfferStatus;
  rok_isteka: string | null;
  created_at: string;
}

export interface OrderRow {
  id: string;
  shipment_id: string;
  offer_id: string;
  courier_id: string;
  cena: string;
  provizija: string | null;
  status: OrderStatus;
  otkazano_razlog: string | null;
  created_at: string;
  updated_at: string;
}

export interface RatingRow {
  id: string;
  order_id: string;
  ocena: number;
  komentar: string | null;
  created_at: string;
}

export interface CommissionSettingRow {
  id: number;
  procenat: string;
  updated_at: string;
}

export interface OpstiUsloviMeta {
  id: string;
  naziv_fajla: string;
  created_at: string;
}

export interface CommissionInvoiceRow {
  id: string;
  courier_id: string;
  period_start: string;
  period_end: string;
  iznos: string;
  status: InvoiceStatus;
  naplata_referenca: string | null;
  created_at: string;
  placeno_at: string | null;
}
