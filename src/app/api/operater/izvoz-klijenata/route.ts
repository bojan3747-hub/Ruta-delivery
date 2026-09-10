import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getCurrentUser } from "@/lib/auth";
import { listCompaniesForOperator } from "@/lib/queries/companies";

/**
 * Izvoz liste registrovanih klijenata u Excel (.xlsx) za operatera (Faza 7)
 * — isti obrazac kao izvoz istorije pošiljki kod klijenta
 * (/api/klijent/izvoz), samo za drugu tabelu i drugu rolu.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "OPERATOR") {
    return NextResponse.json({ error: "Nemate pristup." }, { status: 403 });
  }

  const companies = await listCompaniesForOperator();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Ruta-Dostava";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Klijenti");

  sheet.columns = [
    { header: "Naziv firme", key: "naziv", width: 28 },
    { header: "PIB", key: "pib", width: 14 },
    { header: "Adresa", key: "adresa", width: 30 },
    { header: "Kontakt ime", key: "kontaktIme", width: 22 },
    { header: "Telefon", key: "telefon", width: 16 },
    { header: "Email", key: "email", width: 26 },
    { header: "Ocena", key: "ocena", width: 10 },
    { header: "Datum registracije", key: "datum", width: 16 },
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.autoFilter = { from: "A1", to: "H1" };

  for (const c of companies) {
    sheet.addRow({
      naziv: c.naziv,
      pib: c.pib ?? "",
      adresa: c.adresa ?? "",
      kontaktIme: c.kontakt_ime,
      telefon: c.kontakt_telefon ?? "",
      email: c.kontakt_email,
      ocena: c.ocena_prosek ? Number(c.ocena_prosek) : "",
      datum: new Date(c.created_at).toLocaleDateString("sr-RS"),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const datum = new Date().toISOString().slice(0, 10);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="ruta-dostava-klijenti-${datum}.xlsx"`,
    },
  });
}
