"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "../auth";
import { revalidatePath } from "next/cache";
import { cancelShipment, createShipment } from "../queries/shipments";
import { computeRealRoute } from "../geocode";
import type {
  ShipmentContentType,
  ShipmentType,
  SpecialCargoType,
  TerminType,
  Zone,
} from "../types";
import { SHIPMENT_CONTENT_LABELS, SPECIAL_CARGO_LABELS, formatDateTime } from "../labels";
import type { ActionState } from "./auth-actions";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function createShipmentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT" || !user.companyId) {
    return { error: "Morate biti prijavljeni kao klijent." };
  }

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
  const zeljeniTermin = str(formData, "zeljeniTermin") as TerminType;
  const terminDetaljiRaw = str(formData, "terminDetalji");
  // Faza 8: "Zakazano" sad ima pravo polje datum+vreme (terminDatumVreme,
  // <input type="datetime-local">) umesto slobodnog teksta — "Danas do"
  // ostaje slobodan tekst (terminDetalji), nepromenjeno.
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
  if (!(sadrzajPosiljke in SHIPMENT_CONTENT_LABELS)) {
    return { error: "Izaberite validan sadržaj pošiljke." };
  }
  if (posebnaKategorijaTereta && !(posebnaKategorijaTereta in SPECIAL_CARGO_LABELS)) {
    return { error: "Izaberite validnu posebnu kategoriju tereta." };
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

  // Prava vozna udaljenost preko Mapbox-a (KAN: "prava ruta umesto procene
  // po zonama") — best effort, nikad ne sme da blokira kreiranje pošiljke.
  // Kad ne uspe (adresa nije prepoznata, mreža, itd.), realRoute je null i
  // pošiljka se kreira bez tih podataka — cena/ETA padaju nazad na
  // procenu po zonama (vidi src/lib/pricing.ts).
  const realRoute = await computeRealRoute(adresaPreuzimanja, adresaIsporuke);

  const shipment = await createShipment({
    clientId: user.companyId,
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
    zeljeniTermin,
    terminDetalji,
    terminDatumVreme,
    napomena: napomena || undefined,
    deklarisanaVrednost,
    preuzimanjeLat: realRoute?.preuzimanjeLat,
    preuzimanjeLon: realRoute?.preuzimanjeLon,
    isporukaLat: realRoute?.isporukaLat,
    isporukaLon: realRoute?.isporukaLon,
    udaljenostKm: realRoute?.udaljenostKm,
  });

  redirect(`/klijent/posiljke/${shipment.id}`);
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
