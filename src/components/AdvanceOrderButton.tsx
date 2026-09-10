"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { advanceOrderAction } from "@/lib/actions/order-actions";
import { nextStatusLabel } from "@/lib/labels";
import type { OrderStatus } from "@/lib/types";

export function AdvanceOrderButton({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const label = nextStatusLabel(status);
  // Faza 9: pošto je "U tranzitu"/"Na isporuci" sad jedan spojen korak,
  // klik koji vodi u ISPORUCENO (i traži foto-dokaz) sad se dešava iz
  // U_TRANZITU — NA_ISPORUCI ostaje kao siguran fallback za retku
  // porudžbinu zatečenu u starom statusu (vidi NEXT_STATUS u
  // src/lib/queries/orders.ts).
  const isFinalStep = status === "U_TRANZITU" || status === "NA_ISPORUCI";

  if (!label) return null;

  function submit() {
    startTransition(async () => {
      setError(null);
      const formData = new FormData();
      const file = fileRef.current?.files?.[0];
      if (file) formData.append("fotografija", file);
      const result = await advanceOrderAction(orderId, formData);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {isFinalStep && (
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="text-xs"
          title="Foto-dokaz o isporuci (opciono)"
        />
      )}
      <button
        type="button"
        disabled={isPending}
        onClick={submit}
        className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
      >
        {isPending ? "Ažuriranje..." : `Označi: ${label}`}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
