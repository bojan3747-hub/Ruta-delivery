"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCourierCommissionAction } from "@/lib/actions/operator-actions";

// Faza 12: mala forma pored svakog dostavljača na /operater/dostavljaci —
// operater upisuje lični procenat provizije (uvek ima prednost nad
// automatskim besplatnim periodom i globalnim procentom), ili je prazna da
// bi dostavljač pratio automatiku (vidi getEffectiveCommissionPercent).
export function CourierCommissionForm({
  courierId,
  current,
}: {
  courierId: string;
  current: number | null;
}) {
  const [value, setValue] = useState(current === null ? "" : String(current));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    setError(null);
    const trimmed = value.trim();
    const percent = trimmed === "" ? null : Number(trimmed);
    if (percent !== null && (!Number.isFinite(percent) || percent < 0 || percent > 100)) {
      setError("0–100, ili prazno za automatiku.");
      return;
    }
    startTransition(async () => {
      const result = await setCourierCommissionAction(courierId, percent);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min="0"
          max="100"
          step="0.1"
          placeholder="auto"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-16 rounded-md border border-black/15 px-2 py-1 text-xs"
        />
        <span className="text-xs text-neutral-500">%</span>
        <button
          type="button"
          disabled={isPending}
          onClick={submit}
          className="rounded-md border border-black/15 px-2 py-1 text-xs font-medium hover:bg-black/5 disabled:opacity-50"
        >
          {isPending ? "..." : "Sačuvaj"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
