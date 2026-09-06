"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../auth";
import {
  createPreApprovedCourier,
  listCouriersForOperator,
  setCourierStatus,
  setCourierVerified,
} from "../queries/couriers";
import { setCommissionPercent } from "../queries/commission";
import { generateInvoicesForPeriod, setInvoiceStatus } from "../queries/invoices";
import { uploadOpstiUslovi } from "../queries/opsti-uslovi";
import { parseCsv } from "../csv";
import type { ActionState } from "./auth-actions";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

async function requireOperator() {
  const user = await getCurrentUser();
  if (!user || user.role !== "OPERATOR") {
    throw new Error("Morate biti prijavljeni kao operater.");
  }
  return user;
}

export async function createPreApprovedCourierAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireOperator();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Greška." };
  }

  const naziv = str(formData, "naziv");
  const telefon = str(formData, "telefon");
  const izvorKontakta = str(formData, "izvorKontakta");

  if (!naziv || !telefon || !izvorKontakta) {
    return { error: "Popunite sva obavezna polja." };
  }

  await createPreApprovedCourier({ naziv, telefon, izvorKontakta });

  revalidatePath("/operater/dostavljaci");
  return { success: true };
}

export async function bulkImportCouriersAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireOperator();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Greška." };
  }

  const file = formData.get("csv");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Izaberite CSV fajl." };
  }

  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length === 0) {
    return { error: "Fajl je prazan." };
  }

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idxNaziv = header.indexOf("naziv");
  const idxTelefon = header.indexOf("telefon");
  const idxIzvor = header.indexOf("izvor_kontakta");

  if (idxNaziv === -1 || idxTelefon === -1) {
    return {
      error:
        "CSV mora imati zaglavlje sa kolonama 'naziv' i 'telefon' (kolona 'izvor_kontakta' je opciona).",
    };
  }

  const existing = await listCouriersForOperator();
  const seenPhones = new Set(existing.map((c) => c.telefon.trim()));

  let created = 0;
  let skippedDuplicate = 0;
  const rowErrors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.every((f) => f.trim() === "")) continue;

    const naziv = (row[idxNaziv] ?? "").trim();
    const telefon = (row[idxTelefon] ?? "").trim();
    const izvorKontakta =
      (idxIzvor !== -1 ? row[idxIzvor] : "")?.trim() || "CSV uvoz";

    if (!naziv || !telefon) {
      rowErrors.push(`Red ${i + 1}: nedostaje naziv ili telefon.`);
      continue;
    }
    if (seenPhones.has(telefon)) {
      skippedDuplicate += 1;
      continue;
    }

    await createPreApprovedCourier({ naziv, telefon, izvorKontakta });
    seenPhones.add(telefon);
    created += 1;
  }

  revalidatePath("/operater/dostavljaci");

  const summary = [`Uvezeno: ${created}`];
  if (skippedDuplicate > 0) {
    summary.push(`preskočeno (telefon već postoji): ${skippedDuplicate}`);
  }
  if (rowErrors.length > 0) {
    summary.push(`redova sa greškom: ${rowErrors.length}`);
  }

  return {
    success: true,
    message:
      summary.join(", ") +
      (rowErrors.length > 0 ? "\n" + rowErrors.slice(0, 10).join("\n") : ""),
  };
}

export async function setCourierStatusAction(
  courierId: string,
  status: "AKTIVAN" | "SUSPENDOVAN"
): Promise<{ error?: string }> {
  try {
    await requireOperator();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Greška." };
  }

  try {
    await setCourierStatus(courierId, status);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Greška." };
  }

  revalidatePath("/operater/dostavljaci");
  return {};
}

export async function setCourierVerifiedAction(
  courierId: string,
  verifikovan: boolean
): Promise<{ error?: string }> {
  try {
    await requireOperator();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Greška." };
  }

  await setCourierVerified(courierId, verifikovan);
  revalidatePath("/operater/dostavljaci");
  return {};
}

export async function setCommissionAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireOperator();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Greška." };
  }

  const procenat = Number(str(formData, "procenat"));
  if (!Number.isFinite(procenat) || procenat < 0 || procenat > 100) {
    return { error: "Procenat provizije mora biti između 0 i 100." };
  }

  await setCommissionPercent(procenat);
  revalidatePath("/operater/provizija");
  return { success: true };
}

export async function generateInvoicesAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireOperator();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Greška." };
  }

  const periodStr = String(formData.get("period") ?? "");
  const periodStart = new Date(`${periodStr}-01T00:00:00Z`);
  if (Number.isNaN(periodStart.getTime())) {
    return { error: "Izaberite validan mesec." };
  }

  const created = await generateInvoicesForPeriod(periodStart);
  revalidatePath("/operater/provizija");
  return { success: true, message: `Kreirano faktura: ${created}.` };
}

export async function markInvoicePaidAction(invoiceId: string): Promise<{ error?: string }> {
  try {
    await requireOperator();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Greška." };
  }

  await setInvoiceStatus(invoiceId, "NAPLACENO");
  revalidatePath("/operater/provizija");
  return {};
}

export async function uploadOpstiUsloviAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireOperator();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Greška." };
  }

  const file = formData.get("pdf");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Izaberite PDF fajl." };
  }
  if (file.type !== "application/pdf") {
    return { error: "Fajl mora biti PDF." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await uploadOpstiUslovi(file.name, buffer);

  revalidatePath("/operater/opsti-uslovi");
  revalidatePath("/opsti-uslovi");
  return { success: true };
}
