"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCourierAvailabilityAction } from "@/lib/actions/courier-actions";

export function CourierAvailabilityToggle({
  dostupan,
}: {
  dostupan: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex items-center gap-3 rounded-lg border border-black/10 bg-white p-4">
      <div className="flex-1">
        <p className="font-medium">
          {dostupan ? "Dostupni ste za nove zahteve" : "Na pauzi"}
        </p>
        <p className="text-sm text-neutral-500">
          {dostupan
            ? "Trenutno dobijate ponude za nove pošiljke."
            : "Ne dobijate nove zahteve za ponude dok se ne vratite."}
        </p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await setCourierAvailabilityAction(!dostupan);
            if (result.error) setError(result.error);
            else router.refresh();
          })
        }
        className={`shrink-0 rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50 ${
          dostupan
            ? "border-black/15 hover:bg-black/5"
            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
        }`}
      >
        {isPending ? "..." : dostupan ? "Idi na pauzu" : "Vrati se"}
      </button>
    </div>
  );
}
