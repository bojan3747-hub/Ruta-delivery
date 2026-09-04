"use client";

import { useState, useTransition } from "react";
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
  const label = nextStatusLabel(status);

  if (!label) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await advanceOrderAction(orderId);
            if (result.error) setError(result.error);
            else router.refresh();
          })
        }
        className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
      >
        {isPending ? "Ažuriranje..." : `Označi: ${label}`}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
