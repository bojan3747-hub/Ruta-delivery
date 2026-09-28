"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { advanceMachineRequestAction } from "@/lib/actions/machine-request-actions";
import { nextMachineRequestStatusLabel } from "@/lib/labels";
import type { MachineRequestStatus } from "@/lib/types";

export function AdvanceMachineRequestButton({
  requestId,
  status,
}: {
  requestId: string;
  status: MachineRequestStatus;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const label = nextMachineRequestStatusLabel(status);

  if (!label) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await advanceMachineRequestAction(requestId);
            if (result.error) setError(result.error);
            else router.refresh();
          })
        }
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {isPending ? "Ažuriranje..." : `Označi: ${label}`}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
