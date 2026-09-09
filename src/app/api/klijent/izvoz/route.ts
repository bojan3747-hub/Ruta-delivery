import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getCurrentUser } from "@/lib/auth";
import { listShipmentsForExport } from "@/lib/queries/shipments";
import { ZONE_LABELS } from "@/lib/zones";
import {
  SHIPMENT_CONTENT_LABELS,
  SHIPMENT_STATUS_LABELS,
  SHIPMENT_TYPE_LABELS,
} from "@/lib/labels";
import type { ShipmentStatus } from "@/lib/types";

/**
 * Izvoz istorije pošiljki ulogovanog klijenta u Excel (.xlsx) — dugme
 * "Izvezi u Excel" na /klijent (KAN: klijent treba nešto da izvuče za
 * knjigovodstvo). Poštuje isti ?status= filter kao i lista na /klijent.
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT" || !user.companyId) {
    return NextResponse.json({ error: "Nemate pristup." }, { status: 403 });
  }

  const statusParam = req.nextUrl.searchParams.get("status");
  const status =
    statusParam && statusParam in SHIPMENT_STATUS_LABELS
      ? (statusParam as ShipmentStatus)
      : undefined;

  const shipments = await listShipmentsForExport(user.companyId, status);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Ruta-Dostava";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Pošiljke");

  sheet.columns = [
    { header: "Datum", key: "datum", width: 12 },
    { header: "Status", key: "status", width: 16 },
    { header: "Zona preuzimanja", key: "zonaPreuzimanja", width: 16 },
    { header: "Zona isporuke", key: "zonaIsporuke", width: 16 },
    { header: "Adresa preuzimanja", key: "adresaPreuzimanja", width: 30 },
    { header: "Adresa isporuke", key: "adresaIsporuke", width: 30 },
    { header: "Pošiljalac", key: "posiljalac", width: 20 },
    { header: "Primalac", key: "primalac", width: 20 },
    { header: "Tip pošiljke", key: "tip", width: 16 },
    { header: "Sadržaj", key: "sadrzaj", width: 24 },
    { header: "Udaljenost (km)", key: "udaljenost", width: 14 },
    { header: "Cena (RSD)", key: "cena", width: 12 },
    { header: "Dostavljač", key: "dostavljac", width: 22 },
    { header: "Napomena", key: "napomena", width: 30 },
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.autoFilter = { from: "A1", to: "N1" };

  for (const s of shipments) {
    sheet.addRow({
      datum: new Date(s.created_at).toLocaleDateString("sr-RS"),
      status: SHIPMENT_STATUS_LABELS[s.status],
      zonaPreuzimanja: ZONE_LABELS[s.zona_preuzimanja],
      zonaIsporuke: ZONE_LABELS[s.zona_isporuke],
      adresaPreuzimanja: s.adresa_preuzimanja,
      adresaIsporuke: s.adresa_isporuke,
      posiljalac: s.posiljalac_ime ?? "",
      primalac: s.primalac_ime ?? "",
      tip: SHIPMENT_TYPE_LABELS[s.tip],
      sadrzaj: s.sadrzaj_posiljke
        ? SHIPMENT_CONTENT_LABELS[s.sadrzaj_posiljke]
        : "",
      udaljenost: s.udaljenost_km ? Number(s.udaljenost_km) : "",
      cena: s.order_cena ? Number(s.order_cena) : "",
      dostavljac: s.courier_naziv ?? "",
      napomena: s.napomena ?? "",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const datum = new Date().toISOString().slice(0, 10);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="ruta-dostava-posiljke-${datum}.xlsx"`,
    },
  });
}
