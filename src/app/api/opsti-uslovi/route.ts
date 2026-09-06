import { NextResponse } from "next/server";
import { getCurrentOpstiUsloviFile } from "@/lib/queries/opsti-uslovi";

export async function GET() {
  const doc = await getCurrentOpstiUsloviFile();
  if (!doc) {
    return NextResponse.json({ error: "Dokument nije postavljen." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(doc.sadrzaj), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${doc.naziv_fajla}"`,
    },
  });
}
