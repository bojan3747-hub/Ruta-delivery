"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markInvoicePaidAction } from "@/lib/actions/operator-actions";

export function MarkInvoicePaidButton({ invoiceId }: { invoiceId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await markInvoicePaidAction(invoiceId);
            if (result.error) setError(result.error);
            else router.refresh();
          })
        }
        className="rounded-md border border-black/15 px-3 py-1.5 text-xs font-medium hover:bg-black/5 disabled:opacity-50"
      >
        {isPending ? "..." : "Označi kao naplaćeno"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
