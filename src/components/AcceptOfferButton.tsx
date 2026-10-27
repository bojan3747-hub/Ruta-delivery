"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptOfferAction, acceptOfferGuestAction } from "@/lib/actions/offer-actions";

export function AcceptOfferButton({
  shipmentId,
  offerId,
  gostToken,
}: {
  shipmentId: string;
  offerId: string;
  /** Faza 24: kad je stranica /pracenje/[token] (gost, bez sesije), prosleđuje
   * se token i poziva se gost-varijanta akcije umesto sesijske. */
  gostToken?: string;
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
            const result = gostToken
              ? await acceptOfferGuestAction(shipmentId, offerId, gostToken)
              : await acceptOfferAction(shipmentId, offerId);
            if (result.error) {
              setError(result.error);
            } else {
              router.refresh();
            }
          })
        }
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {isPending ? "Prihvatanje..." : "Prihvati ponudu"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
