import type {
  InvoiceStatus,
  OfferStatus,
  OrderStatus,
  ShipmentStatus,
  ShipmentType,
  TerminType,
  VehicleType,
} from "./types";

export const SHIPMENT_TYPE_LABELS: Record<ShipmentType, string> = {
  DOKUMENT: "Dokument",
  MALI_PAKET: "Mali paket",
  SREDNJI_PAKET: "Srednji paket",
  VELIKI_PAKET: "Veliki paket",
};

export const TERMIN_LABELS: Record<TerminType, string> = {
  ODMAH: "Odmah",
  DANAS_DO: "Danas do određenog vremena",
  ZAKAZANO: "Zakazano",
};

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  OTVORENA: "Otvorena — čeka ponude",
  PONUDE_STIGLE: "Ponude stigle",
  IZABRANA: "Dostavljač izabran",
  ZAVRSENA: "Završena",
  OTKAZANA: "Otkazana",
};

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  POSLATA: "Poslata",
  PRIHVACENA: "Prihvaćena",
  ODBIJENA: "Odbijena",
  ISTEKLA: "Istekla",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PREUZETO: "Preuzeto",
  U_TRANZITU: "U tranzitu",
  NA_ISPORUCI: "Na isporuci",
  ISPORUCENO: "Isporučeno",
  OTKAZANO: "Otkazano",
};

export const ORDER_STATUS_STEPS: OrderStatus[] = [
  "PREUZETO",
  "U_TRANZITU",
  "NA_ISPORUCI",
  "ISPORUCENO",
];

/** Label for the button that advances an order to its next delivery status, or null if it's final. */
export function nextStatusLabel(current: OrderStatus): string | null {
  const idx = ORDER_STATUS_STEPS.indexOf(current);
  if (idx === -1 || idx === ORDER_STATUS_STEPS.length - 1) return null;
  return ORDER_STATUS_LABELS[ORDER_STATUS_STEPS[idx + 1]];
}

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  MOTOR: "Motor",
  PUTNICKO_VOZILO: "Putničko vozilo",
  KOMBI: "Kombi",
  KAMION: "Kamion",
};

export function formatMoney(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  return `${n.toLocaleString("sr-RS", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} RSD`;
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  NEPLACENO: "Neplaćeno",
  NAPLACENO: "Naplaćeno",
  NEUSPESNO: "Neuspešna naplata",
};

export function formatMonth(value: string): string {
  return new Date(value).toLocaleDateString("sr-RS", { month: "long", year: "numeric" });
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("sr-RS", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
