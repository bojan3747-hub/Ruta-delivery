const COLORS: Record<string, string> = {
  // shipment / offer / order statuses that mean "in progress"
  OTVORENA: "bg-amber-100 text-amber-800",
  PONUDE_STIGLE: "bg-amber-100 text-amber-800",
  POSLATA: "bg-amber-100 text-amber-800",
  NA_POTVRDI: "bg-amber-100 text-amber-800",
  IZABRANA: "bg-blue-100 text-blue-800",
  NEPLACENO: "bg-amber-100 text-amber-800",
  PREUZETO: "bg-blue-100 text-blue-800",
  U_TRANZITU: "bg-blue-100 text-blue-800",
  NA_ISPORUCI: "bg-blue-100 text-blue-800",
  // done / good
  ZAVRSENA: "bg-emerald-100 text-emerald-800",
  ISPORUCENO: "bg-emerald-100 text-emerald-800",
  PRIHVACENA: "bg-emerald-100 text-emerald-800",
  AKTIVAN: "bg-emerald-100 text-emerald-800",
  NAPLACENO: "bg-emerald-100 text-emerald-800",
  // bad / cancelled
  OTKAZANA: "bg-neutral-200 text-neutral-600",
  OTKAZANO: "bg-neutral-200 text-neutral-600",
  ODBIJENA: "bg-red-100 text-red-700",
  NEUSPESNO: "bg-red-100 text-red-700",
  ISTEKLA: "bg-neutral-200 text-neutral-600",
};

export function StatusBadge({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  const color = COLORS[status] ?? "bg-neutral-100 text-neutral-700";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}
    >
      {label}
    </span>
  );
}
