"use client";

import { useActionState, useState } from "react";
import { submitRatingAction } from "@/lib/actions/rating-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionState = {};

export function RatingForm({ orderId }: { orderId: string }) {
  const [state, formAction] = useActionState(submitRatingAction, initialState);
  const [ocena, setOcena] = useState(5);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-black/10 bg-white p-4">
      <h3 className="font-medium">Ocenite dostavljača</h3>
      <FormMessage error={state.error} />
      <input type="hidden" name="orderId" value={orderId} />
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setOcena(n)}
            className={`text-2xl ${n <= ocena ? "text-amber-500" : "text-neutral-300"}`}
            aria-label={`${n} zvezdica`}
          >
            ★
          </button>
        ))}
      </div>
      <input type="hidden" name="ocena" value={ocena} />
      <textarea
        name="komentar"
        rows={2}
        placeholder="Komentar (opciono)"
        className="w-full rounded-md border border-black/15 px-3 py-2 text-sm"
      />
      <SubmitButton>Pošalji ocenu</SubmitButton>
    </form>
  );
}
