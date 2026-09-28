"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelMachineRequestAction } from "@/lib/actions/machine-request-actions";

export function CancelMachineRequestButton({ requestId }: { requestId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!confirm("Otkazati ovaj zahtev za angažovanje?")) return;
          startTransition(async () => {
            setError(null);
            const result = await cancelMachineRequestAction(requestId);
            if (result.error) setError(result.error);
            else router.refresh();
          });
        }}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {isPending ? "Otkazivanje..." : "Otkaži zahtev"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
