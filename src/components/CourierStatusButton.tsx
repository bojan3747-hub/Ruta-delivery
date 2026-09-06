"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCourierStatusAction } from "@/lib/actions/operator-actions";
import type { CourierStatus } from "@/lib/types";

export function CourierStatusButton({
  courierId,
  status,
}: {
  courierId: string;
  status: CourierStatus;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (status === "NA_POTVRDI") return null;

  const target = status === "AKTIVAN" ? "SUSPENDOVAN" : "AKTIVAN";
  const label = status === "AKTIVAN" ? "Suspenduj" : "Reaktiviraj";
  const confirmMsg =
    status === "AKTIVAN"
      ? "Suspendovati ovog dostavljača? Neće više dobijati nove zahteve za ponude dok ga ne reaktivirate."
      : "Reaktivirati ovog dostavljača?";

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!confirm(confirmMsg)) return;
          startTransition(async () => {
            setError(null);
            const result = await setCourierStatusAction(courierId, target);
            if (result.error) setError(result.error);
            else router.refresh();
          });
        }}
        className={`rounded-md border px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
          status === "AKTIVAN"
            ? "border-red-200 text-red-700 hover:bg-red-50"
            : "border-black/15 hover:bg-black/5"
        }`}
      >
        {isPending ? "..." : label}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
