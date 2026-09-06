"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSavedAddressAction } from "@/lib/actions/saved-address-actions";

export function DeleteSavedAddressButton({ addressId }: { addressId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!confirm("Obrisati ovu adresu?")) return;
          startTransition(async () => {
            setError(null);
            const result = await deleteSavedAddressAction(addressId);
            if (result.error) setError(result.error);
            else router.refresh();
          });
        }}
        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {isPending ? "..." : "Obriši"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
