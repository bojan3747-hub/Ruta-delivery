import { query, queryOne } from "../db";
import type { CommissionInvoiceRow, InvoiceStatus } from "../types";

export interface InvoiceWithCourier extends CommissionInvoiceRow {
  courier_naziv: string;
}

function monthBounds(periodStart: Date): { start: string; end: string } {
  const start = new Date(Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth(), 1));
  const end = new Date(Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth() + 1, 1));
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

/**
 * Generiše (ili dopunjuje) mesečne fakture provizije za dati period: sabira
 * proviziju svih isporučenih porudžbina po dostavljaču u tom mesecu i
 * upisuje po jedan red za svakog dostavljača koji još nema fakturu za taj
 * period (courier_id + period_start su jedinstveni, pa je bezbedno pozvati
 * više puta za isti mesec). Vraća broj novokreiranih faktura.
 */
export async function generateInvoicesForPeriod(periodStart: Date): Promise<number> {
  const { start, end } = monthBounds(periodStart);

  const rows = await query<{ courier_id: string; iznos: string }>(
    `SELECT courier_id, SUM(provizija) AS iznos
     FROM orders
     WHERE status = 'ISPORUCENO'
       AND provizija IS NOT NULL
       AND updated_at >= $1
       AND updated_at < $2
     GROUP BY courier_id
     HAVING SUM(provizija) > 0`,
    [start, end]
  );

  let created = 0;
  for (const row of rows) {
    const result = await queryOne(
      `INSERT INTO commission_invoices (courier_id, period_start, period_end, iznos)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (courier_id, period_start) DO NOTHING
       RETURNING id`,
      [row.courier_id, start, end, row.iznos]
    );
    if (result) created += 1;
  }
  return created;
}

export async function listAllInvoicesForOperator(): Promise<InvoiceWithCourier[]> {
  return query<InvoiceWithCourier>(
    `SELECT ci.*, c.naziv AS courier_naziv
     FROM commission_invoices ci
     JOIN couriers c ON c.id = ci.courier_id
     ORDER BY ci.period_start DESC, c.naziv ASC`
  );
}

export async function listInvoicesForCourier(
  courierId: string
): Promise<CommissionInvoiceRow[]> {
  return query<CommissionInvoiceRow>(
    `SELECT * FROM commission_invoices WHERE courier_id = $1 ORDER BY period_start DESC`,
    [courierId]
  );
}

export async function setInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus
): Promise<void> {
  await query(
    `UPDATE commission_invoices
     SET status = $1::invoice_status,
         placeno_at = CASE WHEN $1::invoice_status = 'NAPLACENO' THEN now() ELSE placeno_at END
     WHERE id = $2`,
    [status, invoiceId]
  );
}
