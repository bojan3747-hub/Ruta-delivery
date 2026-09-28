import type {
  AddressType,
  ClientType,
  InvoiceStatus,
  MachineRequestStatus,
  MachineType,
  OfferStatus,
  OrderStatus,
  ShipmentContentType,
  ShipmentStatus,
  ShipmentType,
  SpecialCargoType,
  TerminType,
  VehicleType,
} from "./types";

// Faza 8: kg pragovi po korisnikovoj odluci (2026-09-10) — "Mali do 5kg,
// Srednji 5–15kg, Veliki preko 15kg". Ovo je namerno SAMO promena teksta
// ovde (ne šema baze) — postojeći `shipment_type` enum i sva logika oko
// njega ostaju nepromenjeni, ovo samo pojašnjava korisniku šta koja
// kategorija znači pri izboru u formi.
// Faza 19a: klijent (companies) je firma (podrazumevano) ili fizičko lice
// (B2C) — provideri (couriers) ostaju isključivo firme, ovo se ne odnosi
// na njih.
export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  FIRMA: "Firma",
  FIZICKO_LICE: "Fizičko lice",
};

// Faza 19b: mašine koje dostavljač može da ponudi za "Angažovanje mašina",
// isključivo sa rukovaocem — konačna lista potvrđena od korisnika
// (2026-09-28).
export const MACHINE_TYPE_LABELS: Record<MachineType, string> = {
  MINI_BAGER: "Mini bager (kopačica)",
  BAGER_UTOVARIVAC: "Bager-utovarivač (rovokopač)",
  MINI_UTOVARIVAC: "Mini utovarivač",
  VALJAK: "Valjak (vibracioni)",
  VIBRO_PLOCA: "Vibro ploča (nabijačica)",
  AUTO_DIZALICA: "Auto-dizalica (mobilna dizalica)",
  TELESKOPSKI_UTOVARIVAC: "Teleskopski utovarivač (telehendler)",
  VILJUSKAR: "Viljuškar",
  MESALICA_ZA_BETON: "Mešalica za beton",
  PUMPA_ZA_BETON: "Pumpa za beton",
  PLATFORMA_ZA_RAD_NA_VISINI: "Platforma za rad na visini",
  AGREGAT: "Agregat (generator struje)",
  PUMPA_ZA_VODU: "Pumpa za vodu",
  BUSILICA_ZA_RUPE: "Bušilica za rupe/stubove",
};

export const SHIPMENT_TYPE_LABELS: Record<ShipmentType, string> = {
  DOKUMENT: "Dokument",
  MALI_PAKET: "Mali paket (do 5 kg)",
  SREDNJI_PAKET: "Srednji paket (5–15 kg)",
  VELIKI_PAKET: "Veliki paket (preko 15 kg)",
};

// Faza 8: tip sačuvane adrese — da li se prikazuje u dropdown-u za
// pošiljaoca, primaoca, ili oba (podrazumevano, radi kompatibilnosti sa
// adresama sačuvanim pre ove izmene).
export const ADDRESS_TYPE_LABELS: Record<AddressType, string> = {
  POSILJALAC: "Pošiljalac",
  PRIMALAC: "Primalac",
  OBA: "Pošiljalac i primalac",
};

// Faza 5 — spisak preuzet sa bexexpress.rs/najava, polje "Sadržaj" (2026-09-08).
export const SHIPMENT_CONTENT_LABELS: Record<ShipmentContentType, string> = {
  AUTO_DELOVI_I_OPREMA: "Auto delovi i oprema",
  BEBI_OPREMA_I_DECIJE_STVARI: "Bebi oprema i dečje stvari",
  BELA_TEHNIKA: "Bela tehnika",
  DOKUMENT: "Dokument",
  DVORISTE_I_BASTA: "Dvorište i bašta",
  ELEKTRONIKA_I_KOMPONENTE: "Elektronika i komponente",
  GALANTERIJA: "Galanterija",
  GARDEROBA: "Garderoba",
  GRADJEVINSKA_I_ELEKTRO_OPREMA_I_MATERIJAL:
    "Građevinska i elektro oprema i materijal",
  IGRACKE_I_IGRE: "Igračke i igre",
  KNJIGE: "Knjige",
  KOMPJUTERI: "Kompjuteri",
  KOZMETIKA_I_OPREMA: "Kozmetika i oprema",
  KUCNI_APARATI: "Kućni aparati",
  LOV_I_RIBOLOV: "Lov i ribolov",
  MOBILNI_TELEFONI: "Mobilni telefoni",
  MUZICKI_INSTRUMENTI: "Muzički instrumenti",
  NAMESTAJ: "Nameštaj",
  OBUCA: "Obuća",
  POLJOPRIVREDA_I_OPREMA: "Poljoprivreda i oprema",
  SPORTSKA_OPREMA: "Sportska oprema",
  CASOPIS: "Časopis",
  SKOLSKI_PRIBOR_I_KANCELARIJSKA_OPREMA: "Školski pribor i kancelarijska oprema",
};

// Faza 5 — spisak preuzet sa bexexpress.rs/najava, polje "Tip pošiljke"
// (2026-09-08), bez stavke "Standardna" (kod nas to znači prazno polje).
// Ovo je NAMERNO odvojeno od SHIPMENT_TYPE_LABELS: Bex-ov spisak su
// posebne/vangabaritne kategorije tereta, ne veličina paketa.
export const SPECIAL_CARGO_LABELS: Record<SpecialCargoType, string> = {
  BACVA_209L: "Bačva 209 L",
  KURIRSKA_LISTA_DOSTAVA: "Kurirska lista dostava",
  KURIR_DAN: "Kurir dan",
  BICIKL: "Bicikl",
  EURO_PALETA_CELA: "Euro paleta - cela",
  TELEVIZOR_DO_55_INCA: "Televizor do 55 inča",
  GUMA_PUTNICKA: "Guma putnička",
  GUMA_POLUTERETNA: "Guma poluteretna",
  GUMA_TERETNA: "Guma teretna",
  MENJAC_MANJI: "Menjač manji",
  MENJAC_AUTOMATSKI: "Menjač automatski",
  MOTOR_AUTO: "Motor - auto",
  TRAKTORSKA_GUMA: "Traktorska guma",
  TRAKTORSKA_GUMA_SA_FELNOM: "Traktorska guma sa felnom",
  GUMA_PUTNICKA_SA_FELNOM: "Guma putnička sa felnom",
  GUMA_POLUTERETNA_SA_FELNOM: "Guma poluteretna sa felnom",
  GUMA_TERETNA_SA_FELNOM: "Guma teretna sa felnom",
  // Faza 16 (2026-09-23, korisnikov zahtev): "velike" pošiljke koje traže
  // kombi/kamion — bela tehnika, nameštaj i rasuti građevinski materijal.
  FRIZIDER_ZAMRZIVAC: "Frižider / zamrzivač",
  VES_MASINA_MASINA_ZA_SUDOVE: "Veš mašina / mašina za sudove",
  SPORET_RERNA: "Šporet / rerna",
  BOJLER: "Bojler",
  KLIMA_UREDJAJ: "Klima uređaj (spoljna i unutrašnja jedinica)",
  KAUC_TROSED_GARNITURA: "Kauč / trosed / ugaona garnitura",
  ORMAN_PLAKAR: "Orman / plakar",
  KREVET_SA_DUSEKOM: "Krevet (sa dušekom)",
  STO_I_STOLICE: "Trpezarijski sto sa stolicama",
  RASUTI_GRADJEVINSKI_MATERIJAL: "Rasuti materijal (pesak, šljunak, cement)",
  GRADJEVINSKI_SUT_OTPAD: "Građevinski šut / otpad (za odvoz)",
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

// Faza 19c
export const MACHINE_REQUEST_STATUS_LABELS: Record<MachineRequestStatus, string> = {
  OTVOREN: "Otvoren — čeka ponude",
  PRIHVACENO: "Prihvaćeno",
  NA_LOKACIJI: "Na lokaciji",
  ZAVRSENO: "Završeno",
  OTKAZANO: "Otkazano",
};

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  POSLATA: "Poslata",
  PRIHVACENA: "Prihvaćena",
  ODBIJENA: "Odbijena",
  ISTEKLA: "Istekla",
};

// Faza 9 (korisnikova odluka, 2026-09-10): pojednostavljeni statusi —
// "Preuzeto" i "U tranzitu"/"Na isporuci" spajaju se u jedan korak, tako da
// klijent i dostavljač prate samo 3 jasna koraka umesto 4. NA_ISPORUCI
// namerno dobija ISTI tekst kao U_TRANZITU (spojeni koncept) — enum
// vrednost ostaje u bazi (Postgres ne dozvoljava lako brisanje enum
// vrednosti) ali se od ove faze više ne dodeljuje novim porudžbinama, vidi
// NEXT_STATUS u src/lib/queries/orders.ts i migraciju u db/schema.sql.
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PREUZETO: "Primio ponudu",
  U_TRANZITU: "Preuzeo ponudu",
  NA_ISPORUCI: "Preuzeo ponudu",
  ISPORUCENO: "Isporučio",
  OTKAZANO: "Otkazano",
};

export const ORDER_STATUS_STEPS: OrderStatus[] = [
  "PREUZETO",
  "U_TRANZITU",
  "ISPORUCENO",
];

/** Label for the button that advances an order to its next delivery status, or null if it's final. */
export function nextStatusLabel(current: OrderStatus): string | null {
  const idx = ORDER_STATUS_STEPS.indexOf(current);
  if (idx === -1 || idx === ORDER_STATUS_STEPS.length - 1) return null;
  return ORDER_STATUS_LABELS[ORDER_STATUS_STEPS[idx + 1]];
}

// Faza 19d: koraci POSLE prihvatanja ponude (OTVOREN nije uključen, isto
// kao što ORDER_STATUS_STEPS ne uključuje shipment statuse pre porudžbine).
export const MACHINE_REQUEST_STATUS_STEPS: MachineRequestStatus[] = [
  "PRIHVACENO",
  "NA_LOKACIJI",
  "ZAVRSENO",
];

export function nextMachineRequestStatusLabel(
  current: MachineRequestStatus
): string | null {
  const idx = MACHINE_REQUEST_STATUS_STEPS.indexOf(current);
  if (idx === -1 || idx === MACHINE_REQUEST_STATUS_STEPS.length - 1) return null;
  return MACHINE_REQUEST_STATUS_LABELS[MACHINE_REQUEST_STATUS_STEPS[idx + 1]];
}

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  MOTOR: "Motor",
  PUTNICKO_VOZILO: "Putničko vozilo",
  KOMBI: "Kombi",
  KAMION: "Kamion",
  SLEPER: "Šleper",
  SLEP: "Šlep služba (prevoz vozila)",
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

export function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("sr-RS", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
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
