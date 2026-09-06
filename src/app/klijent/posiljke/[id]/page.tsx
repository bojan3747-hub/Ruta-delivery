import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getShipmentById } from "@/lib/queries/shipments";
import { listOffersForShipment } from "@/lib/queries/offers";
import { getOrderByShipmentId } from "@/lib/queries/orders";
import { getRatingForOrder } from "@/lib/queries/ratings";
import { getCourierById } from "@/lib/queries/couriers";
import { ZONE_LABELS } from "@/lib/zones";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STEPS,
  SHIPMENT_STATUS_LABELS,
  SHIPMENT_TYPE_LABELS,
  TERMIN_LABELS,
  formatMoney,
} from "@/lib/labels";
import { StatusBadge } from "@/components/StatusBadge";
import { AcceptOfferButton } from "@/components/AcceptOfferButton";
import { RatingForm } from "@/components/RatingForm";
import { CancelShipmentButton } from "@/components/CancelShipmentButton";
import { CancelOrderButton } from "@/components/CancelOrderButton";

export default async function PosiljkaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const shipment = await getShipmentById(id);

  if (!shipment || !user?.companyId || shipment.client_id !== user.companyId) {
    notFound();
  }

  const order = await getOrderByShipmentId(shipment.id);
  const offers = order ? [] : await listOffersForShipment(shipment.id);
  const courier = order ? await getCourierById(order.courier_id) : null;
  const rating = order ? await getRatingForOrder(order.id) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {ZONE_LABELS[shipment.zona_preuzimanja]} → {ZONE_LABELS[shipment.zona_isporuke]}
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          {shipment.adresa_preuzimanja} → {shipment.adresa_isporuke}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge
          status={shipment.status}
          label={SHIPMENT_STATUS_LABELS[shipment.status]}
        />
        <span className="text-sm text-neutral-500">
          {SHIPMENT_TYPE_LABELS[shipment.tip]}
          {shipment.hitno ? " · Hitno" : ""}
          {shipment.nestandardna ? " · Nestandardna" : ""} ·{" "}
          {TERMIN_LABELS[shipment.zeljeni_termin]}
          {shipment.termin_detalji ? ` (${shipment.termin_detalji})` : ""}
        </span>
      </div>

      {shipment.deklarisana_vrednost && (
        <p className="text-sm text-neutral-500">
          Deklarisana vrednost: {formatMoney(shipment.deklarisana_vrednost)}
        </p>
      )}

      {shipment.napomena && (
        <p className="rounded-md bg-neutral-100 px-3 py-2 text-sm text-neutral-700">
          Napomena: {shipment.napomena}
        </p>
      )}

      {!order &&
        (shipment.status === "OTVORENA" || shipment.status === "PONUDE_STIGLE") && (
          <CancelShipmentButton shipmentId={shipment.id} />
        )}

      {!order && (
        <section className="space-y-3">
          <h2 className="font-semibold">Ponude</h2>
          {offers.length === 0 ? (
            <p className="rounded-lg border border-dashed border-black/15 p-6 text-center text-sm text-neutral-500">
              {shipment.nestandardna
                ? "Čekamo ponude dostavljača za ovu nestandardnu pošiljku (do 15 minuta po dostavljaču)."
                : "Trenutno nema dostavljača koji pokrivaju obe zone i imaju slobodan kapacitet."}
            </p>
          ) : (
            <ul className="divide-y divide-black/10 rounded-lg border border-black/10 bg-white">
              {offers.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{o.courier_naziv}</p>
                    <p className="text-sm text-neutral-500">
                      ETA ~{o.procenjeno_vreme_min} min
                      {o.courier_ocena_prosek
                        ? ` · ★ ${Number(o.courier_ocena_prosek).toFixed(1)}`
                        : ""}
                      {o.napomena ? ` · ${o.napomena}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">{formatMoney(o.cena)}</span>
                    <AcceptOfferButton shipmentId={shipment.id} offerId={o.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {order && (
        <section className="space-y-4">
          <h2 className="font-semibold">Praćenje isporuke</h2>
          <ol className="flex flex-wrap gap-2">
            {ORDER_STATUS_STEPS.map((step, idx) => {
              const currentIdx = ORDER_STATUS_STEPS.indexOf(order.status);
              const reached = order.status !== "OTKAZANO" && idx <= currentIdx;
              return (
                <li key={step} className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      reached
                        ? "bg-emerald-700 text-white"
                        : "bg-neutral-200 text-neutral-500"
                    }`}
                  >
                    {ORDER_STATUS_LABELS[step]}
                  </span>
                  {idx < ORDER_STATUS_STEPS.length - 1 && (
                    <span className="text-neutral-300">→</span>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="rounded-lg border border-black/10 bg-white p-4 text-sm">
            <p>
              <span className="text-neutral-500">Dostavljač:</span>{" "}
              {courier?.naziv} {courier?.telefon ? `· ${courier.telefon}` : ""}
            </p>
            <p className="mt-1">
              <span className="text-neutral-500">Cena:</span>{" "}
              {formatMoney(order.cena)}
            </p>
          </div>

          {order.status === "ISPORUCENO" &&
            (rating ? (
              <p className="rounded-lg border border-black/10 bg-white p-4 text-sm">
                Ocenili ste dostavljača sa {rating.ocena} ★
                {rating.komentar ? ` — “${rating.komentar}”` : ""}
              </p>
            ) : (
              <RatingForm orderId={order.id} />
            ))}

          {order.status === "OTKAZANO" && (
            <p className="rounded-lg border border-black/10 bg-white p-4 text-sm text-neutral-600">
              Porudžbina je otkazana.
              {order.otkazano_razlog ? ` Razlog: ${order.otkazano_razlog}` : ""}
            </p>
          )}

          {order.status !== "ISPORUCENO" && order.status !== "OTKAZANO" && (
            <CancelOrderButton orderId={order.id} />
          )}
        </section>
      )}
    </div>
  );
}
