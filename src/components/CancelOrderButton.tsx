"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelOrderAction } from "@/lib/actions/order-actions";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [razlog, setRazlog] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
      >
        Otkaži porudžbinu
      </button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3">
      <label className="text-xs font-medium text-red-800">
        Razlog otkazivanja (opciono)
      </label>
      <input
        value={razlog}
        onChange={(e) => setRazlog(e.target.value)}
        className="w-full rounded-md border border-black/15 px-2 py-1 text-sm"
        placeholder="npr. vozilo se pokvarilo"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await cancelOrderAction(orderId, razlog || undefined);
              if (result.error) setError(result.error);
              else router.refresh();
            })
          }
          className="rounded-md bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
        >
          {isPending ? "Otkazivanje..." : "Potvrdi otkazivanje"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-black/15 px-3 py-1.5 text-sm hover:bg-black/5"
        >
          Odustani
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
