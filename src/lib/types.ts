// Mirrors db/schema.sql. Kept hand-written because Prisma's engine can't be
// downloaded inside this sandbox (see the note at the top of db/schema.sql);
// prisma/schema.prisma has the same shape for use once the project runs
// somewhere with normal internet access.

export type Role = "CLIENT" | "COURIER" | "OPERATOR";

// Faza 19a (2026-09-28): klijent (companies) sad može biti firma ili fizičko
// lice (B2C) — provideri (couriers) i dalje ostaju isključivo firme, ovo se
// odnosi samo na companies.tip_klijenta.
export type ClientType = "FIRMA" | "FIZICKO_LICE";

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

// Faza 18 (2026-09-24): "ŠLEPER" dodat uz fokus na veća vozila — za pošiljke
// koje ne staju ni u kamion (npr. mašine, veći građevinski teret). "ŠLEP" je
// dodat naknadno, posle korisnikovog ispravke (šleper != šlep) — ovo je
// vozilo/služba koja prevozi DRUGA vozila (npr. pokvaren automobil),
// odvojeno od šlepera (kamiona sa prikolicom za teret).
export type VehicleType =
  | "MOTOR"
  | "PUTNICKO_VOZILO"
  | "KOMBI"
  | "KAMION"
  | "SLEPER"
  | "SLEP";

export type CourierStatus = "NA_POTVRDI" | "AKTIVAN" | "SUSPENDOVAN";

// Faza 19b (2026-09-28): manje građevinske mašine koje dostavljač može da
// ponudi za "Angažovanje mašina" — SVE isključivo sa rukovaocem (nema
// samostalnog najma), konačna lista potvrđena od korisnika.
export type MachineType =
  | "MINI_BAGER"
  | "BAGER_UTOVARIVAC"
  | "MINI_UTOVARIVAC"
  | "VALJAK"
  | "VIBRO_PLOCA"
  | "AUTO_DIZALICA"
  | "TELESKOPSKI_UTOVARIVAC"
  | "VILJUSKAR"
  | "MESALICA_ZA_BETON"
  | "PUMPA_ZA_BETON"
  | "PLATFORMA_ZA_RAD_NA_VISINI"
  | "AGREGAT"
  | "PUMPA_ZA_VODU"
  | "BUSILICA_ZA_RUPE";

export interface CourierMachineRow {
  id: string;
  courier_id: string;
  tip_masine: MachineType;
  cena_po_satu: string | null;
  cena_po_danu: string | null;
  created_at: string;
}

// Faza 19c: zahtev klijenta za angažovanje mašine (poseban od ShipmentRow).
export interface MachineRequestRow {
  id: string;
  client_id: string;
  zona: Zone;
  adresa: string;
  tip_masine: MachineType;
  opis_posla: string;
  zeljeni_termin: string | null;
  kontakt_ime: string | null;
  kontakt_telefon: string | null;
  napomena: string | null;
  status: MachineRequestStatus;
  created_at: string;
  // Faza 19d: popunjeno kad je ponuda prihvaćena (vidi machine_offers).
  courier_id: string | null;
  accepted_offer_id: string | null;
  cena: string | null;
  updated_at: string;
  na_lokaciji_at: string | null;
  zavrseno_at: string | null;
  otkazano_razlog: string | null;
  // Faza 19e: obračunato kad angažovanje pređe u ZAVRSENO.
  provizija: string | null;
}

// Faza 19d: ručna ponuda provajdera za angažovanje mašine — reuse
// postojećeg OfferStatus (isti obrazac kao offers/shipments).
export interface MachineOfferRow {
  id: string;
  machine_request_id: string;
  courier_id: string;
  cena: string;
  procena_trajanja: string;
  napomena: string | null;
  status: OfferStatus;
  created_at: string;
}

export type ShipmentType =
  | "DOKUMENT"
  | "MALI_PAKET"
  | "SREDNJI_PAKET"
  | "VELIKI_PAKET";

// Faza 5: "Sadržaj pošiljke" — po uzoru na Bex Express dropdown
// (bexexpress.rs/najava, polje "Sadržaj", skinuto 2026-09-08). Obavezno
// polje za nove pošiljke; nullable u bazi jer starije pošiljke nemaju
// vrednost.
export type ShipmentContentType =
  | "AUTO_DELOVI_I_OPREMA"
  | "BEBI_OPREMA_I_DECIJE_STVARI"
  | "BELA_TEHNIKA"
  | "DOKUMENT"
  | "DVORISTE_I_BASTA"
  | "ELEKTRONIKA_I_KOMPONENTE"
  | "GALANTERIJA"
  | "GARDEROBA"
  | "GRADJEVINSKA_I_ELEKTRO_OPREMA_I_MATERIJAL"
  | "IGRACKE_I_IGRE"
  | "KNJIGE"
  | "KOMPJUTERI"
  | "KOZMETIKA_I_OPREMA"
  | "KUCNI_APARATI"
  | "LOV_I_RIBOLOV"
  | "MOBILNI_TELEFONI"
  | "MUZICKI_INSTRUMENTI"
  | "NAMESTAJ"
  | "OBUCA"
  | "POLJOPRIVREDA_I_OPREMA"
  | "SPORTSKA_OPREMA"
  | "CASOPIS"
  | "SKOLSKI_PRIBOR_I_KANCELARIJSKA_OPREMA";

// Faza 5: "Posebna kategorija tereta" — opciono, dodatno polje pored
// postojećeg veličinskog "Tip pošiljke". Spisak po uzoru na Bex Express
// dropdown "Tip pošiljke" (bexexpress.rs/najava, skinuto 2026-09-08),
// bez stavke "Standardna" jer to kod nas znači da polje ostaje prazno.
export type SpecialCargoType =
  | "BACVA_209L"
  | "KURIRSKA_LISTA_DOSTAVA"
  | "KURIR_DAN"
  | "BICIKL"
  | "EURO_PALETA_CELA"
  | "TELEVIZOR_DO_55_INCA"
  | "GUMA_PUTNICKA"
  | "GUMA_POLUTERETNA"
  | "GUMA_TERETNA"
  | "MENJAC_MANJI"
  | "MENJAC_AUTOMATSKI"
  | "MOTOR_AUTO"
  | "TRAKTORSKA_GUMA"
  | "TRAKTORSKA_GUMA_SA_FELNOM"
  | "GUMA_PUTNICKA_SA_FELNOM"
  | "GUMA_POLUTERETNA_SA_FELNOM"
  | "GUMA_TERETNA_SA_FELNOM"
  // Faza 16 (2026-09-23): "velike" pošiljke koje traže kombi/kamion —
  // bela tehnika, nameštaj i rasuti građevinski materijal.
  | "FRIZIDER_ZAMRZIVAC"
  | "VES_MASINA_MASINA_ZA_SUDOVE"
  | "SPORET_RERNA"
  | "BOJLER"
  | "KLIMA_UREDJAJ"
  | "KAUC_TROSED_GARNITURA"
  | "ORMAN_PLAKAR"
  | "KREVET_SA_DUSEKOM"
  | "STO_I_STOLICE"
  | "RASUTI_GRADJEVINSKI_MATERIJAL"
  | "GRADJEVINSKI_SUT_OTPAD";

export type TerminType = "ODMAH" | "DANAS_DO" | "ZAKAZANO";

// Faza 8: tip sačuvane adrese (za koga se koristi — filtrira dropdown u
// formi nove pošiljke).
export type AddressType = "POSILJALAC" | "PRIMALAC" | "OBA";

export type ShipmentStatus =
  | "OTVORENA"
  | "PONUDE_STIGLE"
  | "IZABRANA"
  | "ZAVRSENA"
  | "OTKAZANA";

// Faza 19c: status toka angažovanja mašine — poseban od ShipmentStatus.
export type MachineRequestStatus =
  | "OTVOREN"
  | "PRIHVACENO"
  | "NA_LOKACIJI"
  | "ZAVRSENO"
  | "OTKAZANO";

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
  // Faza 19a: firma (podrazumevano, kompatibilno sa svim postojećim
  // klijentima) ili fizičko lice (B2C) — kod fizičkog lica `naziv` nosi
  // ime i prezime osobe (isto kao kontakt ime sa `users`), a `pib` ostaje
  // prazno.
  tip_klijenta: ClientType;
  ocena_prosek: string | null;
  broj_ocena: number;
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
  // Faza 18: vozilo ima hidrauličnu ruku za utovar/istovar (samostalan
  // utovar bez viljuškara/dizalice na terenu) — nezavisno od tip_vozila,
  // jer i kamion i šleper mogu (ali ne moraju) imati ovu opremu.
  ima_ruku_za_utovar: boolean;
  cena_po_km: string | null;
  cena_po_kg: string | null;
  minimalna_cena: string | null;
  dnevni_kapacitet: number;
  status: CourierStatus;
  dostupan: boolean;
  verifikovan: boolean;
  izvor_kontakta: string | null;
  ocena_prosek: string | null;
  broj_ocena: number;
  aktivacioni_token: string;
  payment_customer_token: string | null;
  created_at: string;
  // Faza 12: automatski besplatan period od aktivacije + ručno podešen
  // lični procenat provizije (uvek ima prednost) — vidi commission.ts.
  aktiviran_at: string | null;
  provizija_procenat: string | null;
  // Faza 19e: poseban lični procenat provizije za angažovanje mašina.
  provizija_procenat_masine: string | null;
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
  posiljalac_ime: string | null;
  posiljalac_telefon: string | null;
  primalac_ime: string | null;
  primalac_telefon: string | null;
  tip: ShipmentType;
  sadrzaj_posiljke: ShipmentContentType | null;
  posebna_kategorija_tereta: SpecialCargoType | null;
  hitno: boolean;
  nestandardna: boolean;
  // Faza 18: klijent naznačava da pošiljka traži veće vozilo — šleper i/ili
  // dostavljača čije vozilo ima ruku za utovar (hidrauličnu dizalicu za
  // samostalan utovar/istovar bez viljuškara na terenu), i/ili šlep službu
  // (prevoz drugog vozila, npr. pokvarenog automobila).
  zahteva_sleper: boolean;
  zahteva_ruku_za_utovar: boolean;
  zahteva_slep: boolean;
  zeljeni_termin: TerminType;
  termin_detalji: string | null;
  napomena: string | null;
  deklarisana_vrednost: string | null;
  preuzimanje_lat: number | null;
  preuzimanje_lon: number | null;
  isporuka_lat: number | null;
  isporuka_lon: number | null;
  udaljenost_km: string | null;
  // Faza 8: pravi datum+vreme za termin "Zakazano" (vidi termin_detalji za
  // formatiran tekst za prikaz — ova kolona je za buduću upotrebu, npr.
  // sortiranje/podsetnike).
  zakazano_datum_vreme: string | null;
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
  // Faza 9: timestamp za svaku promenu statusa — "ponuda prihvaćena" je već
  // pokriveno sa created_at (porudžbina se pravi u tom trenutku). Nullable
  // jer starije porudžbine (pre ove izmene) nemaju ove podatke.
  preuzeto_at: string | null;
  isporuceno_at: string | null;
}

export type RatingDirection = "KLIJENT_KA_DOSTAVLJACU" | "DOSTAVLJAC_KA_KLIJENTU";

export interface RatingRow {
  id: string;
  order_id: string;
  smer: RatingDirection;
  ocena: number;
  komentar: string | null;
  created_at: string;
}

export interface CommissionSettingRow {
  id: number;
  procenat: string;
  // Faza 19e: poseban globalni procenat za angažovanje mašina.
  procenat_masine: string;
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

export interface SavedAddressRow {
  id: string;
  company_id: string;
  naziv: string;
  adresa: string;
  zona: Zone;
  // Faza 8: za koga važi adresa (filtrira dropdown u formi nove pošiljke) i
  // opcioni poštanski broj.
  tip: AddressType;
  postanski_broj: string | null;
  created_at: string;
}
