"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCourierVerifiedAction } from "@/lib/actions/operator-actions";

export function CourierVerifiedButton({
  courierId,
  verifikovan,
}: {
  courierId: string;
  verifikovan: boolean;
}) {
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
            const result = await setCourierVerifiedAction(courierId, !verifikovan);
            if (result.error) setError(result.error);
            else router.refresh();
          })
        }
        className={`rounded-md border px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
          verifikovan
            ? "border-black/15 hover:bg-black/5"
            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
        }`}
      >
        {isPending ? "..." : verifikovan ? "Ukloni verifikaciju" : "Označi kao verifikovan"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
