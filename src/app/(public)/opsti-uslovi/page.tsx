import type { Metadata } from "next";
import { getCurrentOpstiUsloviMeta } from "@/lib/queries/opsti-uslovi";
import { formatDateTime } from "@/lib/labels";

// Faza 17 (2026-09-24): sopstveni canonical/title umesto nasleđenog
// podrazumevanog iz root layout-a (koji je tačan za "/", ne za ovu stranu).
export const metadata: Metadata = {
  title: "Opšti uslovi korišćenja",
  description:
    "Opšti uslovi korišćenja platforme Ruta-Dostava — nalozi, proces dostave, zabranjeni predmeti, plaćanje i odgovornost.",
  alternates: {
    canonical: "/opsti-uslovi",
  },
};

export default async function OpstiUsloviPage() {
  const meta = await getCurrentOpstiUsloviMeta();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Opšti uslovi korišćenja</h1>

      {!meta ? (
        <p className="rounded-lg border border-dashed border-black/15 p-8 text-center text-neutral-500">
          Dokument još nije postavljen.
        </p>
      ) : (
        <>
          <p className="text-sm text-neutral-600">
            Poslednja izmena: {formatDateTime(meta.created_at)} ·{" "}
            <a
              href="/api/opsti-uslovi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 underline hover:text-emerald-800"
            >
              Otvori/preuzmi PDF
            </a>
          </p>
          <embed
            src="/api/opsti-uslovi"
            type="application/pdf"
            className="h-[80vh] w-full rounded-lg border border-black/10"
          />
        </>
      )}
    </div>
  );
}
