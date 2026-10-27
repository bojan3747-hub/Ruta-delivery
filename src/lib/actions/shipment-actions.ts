"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../auth";
import { revalidatePath } from "next/cache";
import {
  cancelShipment,
  createShipment,
  getShipmentByGuestToken,
} from "../queries/shipments";
import { createGuestClientAccount } from "../queries/companies";
import { computeRealRoute } from "../geocode";
import type {
  ShipmentContentType,
  ShipmentType,
  SpecialCargoType,
  TerminType,
  Zone,
} from "../types";
import {
  SHIPMENT_CONTENT_LABELS,
  SPECIAL_CARGO_LABELS,
  SHIPMENT_TYPE_LABELS,
  TERMIN_LABELS,
  formatDateTime,
} from "../labels";
import { ZONE_LABELS } from "../zones";
import { isValidPhone, isTooLong, MAX_NAME_LEN, MAX_TEXT_LEN } from "../validation";
import type { ActionState } from "./auth-actions";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

interface ParsedShipmentFields {
  zonaPreuzimanja: Zone;
  zonaIsporuke: Zone;
  adresaPreuzimanja: string;
  adresaIsporuke: string;
  posiljalacIme: string;
  posiljalacTelefon: string;
  primalacIme: string;
  primalacTelefon: string;
  tip: ShipmentType;
  sadrzajPosiljke: ShipmentContentType;
  posebnaKategorijaTereta?: SpecialCargoType;
  hitno: boolean;
  nestandardna: boolean;
  zahtevaSleper: boolean;
  zahtevaRukuZaUtovar: boolean;
  zahtevaSlep: boolean;
  zeljeniTermin: TerminType;
  terminDetalji?: string;
  terminDatumVreme?: Date;
  napomena: string;
  deklarisanaVrednost: number;
}

/**
 * Validacija polja pošiljke, izdvojena iz createShipmentAction (Faza 24) da
 * bi je mogla deliti i createGuestShipmentAction (gost-forma bez prijave) —
 * isto polje, ista pravila, bez dupliranja. Čista funkcija: ne dira sesiju
 * ni bazu, samo parsira i validira FormData.
 */
function parseAndValidateShipmentFields(
  formData: FormData
): { error: string } | { data: ParsedShipmentFields } {
  const zonaPreuzimanja = str(formData, "zonaPreuzimanja") as Zone;
  const zonaIsporuke = str(formData, "zonaIsporuke") as Zone;
  const adresaPreuzimanja = str(formData, "adresaPreuzimanja");
  const adresaIsporuke = str(formData, "adresaIsporuke");
  const posiljalacIme = str(formData, "posiljalacIme");
  const posiljalacTelefon = str(formData, "posiljalacTelefon");
  const primalacIme = str(formData, "primalacIme");
  const primalacTelefon = str(formData, "primalacTelefon");
  const tip = str(formData, "tip") as ShipmentType;
  const sadrzajPosiljke = str(formData, "sadrzajPosiljke") as ShipmentContentType;
  const posebnaKategorijaTeretaRaw = str(formData, "posebnaKategorijaTereta");
  const posebnaKategorijaTereta = posebnaKategorijaTeretaRaw
    ? (posebnaKategorijaTeretaRaw as SpecialCargoType)
    : undefined;
  const hitno = formData.get("hitno") === "on";
  const nestandardna = formData.get("nestandardna") === "on";
  const zahtevaSleper = formData.get("zahtevaSleper") === "on";
  const zahtevaRukuZaUtovar = formData.get("zahtevaRukuZaUtovar") === "on";
  const zahtevaSlep = formData.get("zahtevaSlep") === "on";
  const zeljeniTermin = str(formData, "zeljeniTermin") as TerminType;
  const terminDetaljiRaw = str(formData, "terminDetalji");
  const terminDatumVremeRaw = str(formData, "terminDatumVreme");
  const napomena = str(formData, "napomena");
  const deklarisanaVrednost = Number(str(formData, "deklarisanaVrednost"));

  if (
    !zonaPreuzimanja ||
    !zonaIsporuke ||
    !adresaPreuzimanja ||
    !adresaIsporuke ||
    !posiljalacIme ||
    !posiljalacTelefon ||
    !primalacIme ||
    !primalacTelefon ||
    !tip ||
    !sadrzajPosiljke ||
    !zeljeniTermin
  ) {
    return { error: "Popunite sva obavezna polja." };
  }
  if (!(zonaPreuzimanja in ZONE_LABELS) || !(zonaIsporuke in ZONE_LABELS)) {
    return { error: "Izaberite validnu zonu preuzimanja i isporuke." };
  }
  if (!(tip in SHIPMENT_TYPE_LABELS)) {
    return { error: "Izaberite validan tip pošiljke." };
  }
  if (!(sadrzajPosiljke in SHIPMENT_CONTENT_LABELS)) {
    return { error: "Izaberite validan sadržaj pošiljke." };
  }
  if (posebnaKategorijaTereta && !(posebnaKategorijaTereta in SPECIAL_CARGO_LABELS)) {
    return { error: "Izaberite validnu posebnu kategoriju tereta." };
  }
  if (!(zeljeniTermin in TERMIN_LABELS)) {
    return { error: "Izaberite validan željeni termin." };
  }
  if (!isValidPhone(posiljalacTelefon) || !isValidPhone(primalacTelefon)) {
    return { error: "Unesite validne brojeve telefona pošiljaoca i primaoca." };
  }
  if (
    isTooLong(posiljalacIme, MAX_NAME_LEN) ||
    isTooLong(primalacIme, MAX_NAME_LEN) ||
    isTooLong(adresaPreuzimanja, MAX_NAME_LEN) ||
    isTooLong(adresaIsporuke, MAX_NAME_LEN)
  ) {
    return { error: "Uneti tekst je predugačak." };
  }
  if (isTooLong(napomena, MAX_TEXT_LEN)) {
    return { error: "Napomena je predugačka." };
  }
  if (!Number.isFinite(deklarisanaVrednost) || deklarisanaVrednost <= 0) {
    return { error: "Unesite validnu deklarisanu vrednost pošiljke (veću od 0)." };
  }
  let terminDetalji: string | undefined;
  let terminDatumVreme: Date | undefined;

  if (zeljeniTermin === "DANAS_DO") {
    if (!terminDetaljiRaw) {
      return {
        error:
          "Unesite tačno vreme/rok isporuke (npr. datum i sat) — dostavljaču mora biti jasno kada se očekuje preuzimanje.",
      };
    }
    if (isTooLong(terminDetaljiRaw, MAX_NAME_LEN)) {
      return { error: "Uneti tekst za termin je predugačak." };
    }
    terminDetalji = terminDetaljiRaw;
  } else if (zeljeniTermin === "ZAKAZANO") {
    if (!terminDatumVremeRaw) {
      return { error: "Unesite datum i vreme željene isporuke." };
    }
    const parsed = new Date(terminDatumVremeRaw);
    if (Number.isNaN(parsed.getTime())) {
      return { error: "Unesite validan datum i vreme isporuke." };
    }
    terminDatumVreme = parsed;
    // termin_detalji se i dalje popunjava (formatiranim tekstom) da bi svi
    // postojeći prikazi (klijent/dostavljač/operater) ostali nepromenjeni.
    terminDetalji = formatDateTime(parsed.toISOString());
  }

  return {
    data: {
      zonaPreuzimanja,
      zonaIsporuke,
      adresaPreuzimanja,
      adresaIsporuke,
      posiljalacIme,
      posiljalacTelefon,
      primalacIme,
      primalacTelefon,
      tip,
      sadrzajPosiljke,
      posebnaKategorijaTereta,
      hitno,
      nestandardna,
      zahtevaSleper,
      zahtevaRukuZaUtovar,
      zahtevaSlep,
      zeljeniTermin,
      terminDetalji,
      terminDatumVreme,
      napomena,
      deklarisanaVrednost,
    },
  };
}

export async function createShipmentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT" || !user.companyId) {
    return { error: "Morate biti prijavljeni kao klijent." };
  }

  const parsed = parseAndValidateShipmentFields(formData);
  if ("error" in parsed) return parsed;
  const f = parsed.data;

  // Prava vozna udaljenost preko Mapbox-a (KAN: "prava ruta umesto procene
  // po zonama") — best effort, nikad ne sme da blokira kreiranje pošiljke.
  // Kad ne uspe (adresa nije prepoznata, mreža, itd.), realRoute je null i
  // pošiljka se kreira bez tih podataka — cena/ETA padaju nazad na
  // procenu po zonama (vidi src/lib/pricing.ts).
  const realRoute = await computeRealRoute(f.adresaPreuzimanja, f.adresaIsporuke);

  const shipment = await createShipment({
    clientId: user.companyId,
    ...f,
    napomena: f.napomena || undefined,
    preuzimanjeLat: realRoute?.preuzimanjeLat,
    preuzimanjeLon: realRoute?.preuzimanjeLon,
    isporukaLat: realRoute?.isporukaLat,
    isporukaLon: realRoute?.isporukaLon,
    udaljenostKm: realRoute?.udaljenostKm,
  });

  redirect(`/klijent/posiljke/${shipment.id}`);
}

/**
 * Faza 24: gost (fizičko lice bez naloga) naruči dostavu — isti set polja
 * pošiljke kao createShipmentAction (deli parseAndValidateShipmentFields),
 * samo umesto sesije uzima ime+telefon direktno iz forme, kreira nalog u
 * pozadini (createGuestClientAccount) i vraća gosta na /pracenje/[token]
 * umesto na /klijent/posiljke/[id] (gost nema pristup klijentskom panelu).
 */
export async function createGuestShipmentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const gostIme = str(formData, "gostIme");
  const gostTelefon = str(formData, "gostTelefon");
  const uslovi = formData.get("uslovi") === "on";

  if (!gostIme || !gostTelefon) {
    return { error: "Unesite ime i telefon." };
  }
  if (isTooLong(gostIme, MAX_NAME_LEN)) {
    return { error: "Ime je predugačko." };
  }
  if (!isValidPhone(gostTelefon)) {
    return { error: "Unesite validan broj telefona." };
  }
  if (!uslovi) {
    return { error: "Morate prihvatiti Opšte uslove korišćenja." };
  }

  const parsed = parseAndValidateShipmentFields(formData);
  if ("error" in parsed) return parsed;
  const f = parsed.data;

  const { company } = await createGuestClientAccount({
    ime: gostIme,
    telefon: gostTelefon,
  });

  const realRoute = await computeRealRoute(f.adresaPreuzimanja, f.adresaIsporuke);
  const gostToken = randomUUID();

  const shipment = await createShipment({
    clientId: company.id,
    ...f,
    napomena: f.napomena || undefined,
    preuzimanjeLat: realRoute?.preuzimanjeLat,
    preuzimanjeLon: realRoute?.preuzimanjeLon,
    isporukaLat: realRoute?.isporukaLat,
    isporukaLon: realRoute?.isporukaLon,
    udaljenostKm: realRoute?.udaljenostKm,
    gostToken,
  });

  redirect(`/pracenje/${shipment.gost_token}`);
}

/** Faza 24: gost otkazuje svoju (još neprihvaćenu) pošiljku preko tokena —
 * reuse iste queries/shipments.cancelShipment funkcije kao i ulogovani
 * klijent (ona već proverava client_id interno), samo se ovlašćenje da je
 * zahtev stvarno gostov utvrđuje preko gost_token poklapanja, ne sesije. */
export async function cancelShipmentGuestAction(
  shipmentId: string,
  gostToken: string
): Promise<{ error?: string }> {
  const shipment = await getShipmentByGuestToken(gostToken);
  if (!shipment || shipment.id !== shipmentId) {
    return { error: "Pošiljka nije pronađena." };
  }

  try {
    await cancelShipment(shipmentId, shipment.client_id);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Greška." };
  }

  revalidatePath(`/pracenje/${gostToken}`);
  return {};
}

export async function cancelShipmentAction(
  shipmentId: string
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT" || !user.companyId) {
    return { error: "Morate biti prijavljeni kao klijent." };
  }

  try {
    await cancelShipment(shipmentId, user.companyId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Greška." };
  }

  revalidatePath(`/klijent/posiljke/${shipmentId}`);
  revalidatePath("/klijent");
  return {};
}
