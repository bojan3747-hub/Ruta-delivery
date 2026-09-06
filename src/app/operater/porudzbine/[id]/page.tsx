import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrderDetailForOperator } from "@/lib/queries/orders";
import { getRatingForOrder } from "@/lib/queries/ratings";
import { hasShipmentFotografija } from "@/lib/queries/shipment-fotografije";
import { ZONE_LABELS } from "@/lib/zones";
import {
  ORDER_STATUS_LABELS,
  SHIPMENT_TYPE_LABELS,
  formatMoney,
  formatDateTime,
} from "@/lib/labels";
import { StatusBadge } from "@/components/StatusBadge";

export default async function OperaterPorudzbinaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderDetailForOperator(id);
  if (!order) notFound();

  const [ratingKlijenta, ratingDostavljaca, hasFotografija] = await Promise.all([
    getRatingForOrder(order.id, "KLIJENT_KA_DOSTAVLJACU"),
    getRatingForOrder(order.id, "DOSTAVLJAC_KA_KLIJENTU"),
    hasShipmentFotografija(order.shipment_id),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/operater/porudzbine" className="text-sm text-emerald-700 hover:underline">
          ← Nazad na porudžbine
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold">
            {ZONE_LABELS[order.zona_preuzimanja]} → {ZONE_LABELS[order.zona_isporuke]}
          </h1>
          <StatusBadge status={order.status} label={ORDER_STATUS_LABELS[order.status]} />
        </div>
        <p className="mt-1 text-sm text-neutral-500">{formatDateTime(order.created_at)}</p>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-4 text-sm space-y-1">
        <p>
          <span className="text-neutral-500">Preuzimanje:</span> {order.adresa_preuzimanja}
        </p>
        <p>
          <span className="text-neutral-500">Isporuka:</span> {order.adresa_isporuke}
        </p>
        <p>
          <span className="text-neutral-500">Tip pošiljke:</span>{" "}
          {SHIPMENT_TYPE_LABELS[order.tip]}
        </p>
        {order.deklarisana_vrednost && (
          <p>
            <span className="text-neutral-500">Deklarisana vrednost:</span>{" "}
            {formatMoney(order.deklarisana_vrednost)}
          </p>
        )}
        {order.napomena && (
          <p>
            <span className="text-neutral-500">Napomena:</span> {order.napomena}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-black/10 bg-white p-4 text-sm">
          <p className="font-medium">Klijent</p>
          <p className="mt-1 text-neutral-600">{order.client_naziv}</p>
          {order.client_kontakt_ime && (
            <p className="text-neutral-600">{order.client_kontakt_ime}</p>
          )}
          {order.client_telefon && <p className="text-neutral-600">{order.client_telefon}</p>}
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-4 text-sm">
          <p className="font-medium">Dostavljač</p>
          <p className="mt-1 text-neutral-600">{order.courier_naziv}</p>
          <p className="text-neutral-600">{order.courier_telefon}</p>
        </div>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-4 text-sm">
        <p>
          <span className="text-neutral-500">Cena:</span> {formatMoney(order.cena)}
        </p>
        {order.provizija && (
          <p className="mt-1">
            <span className="text-neutral-500">Provizija platforme:</span>{" "}
            {formatMoney(order.provizija)}
          </p>
        )}
        {hasFotografija && (
          <p className="mt-1">
            <a
              href={`/api/posiljke/${order.shipment_id}/fotografija`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 hover:underline"
            >
              Pogledajte foto-dokaz o isporuci
            </a>
          </p>
        )}
      </div>

      {order.status === "OTKAZANO" && (
        <p className="rounded-lg border border-black/10 bg-white p-4 text-sm text-neutral-600">
          Porudžbina je otkazana.
          {order.otkazano_razlog ? ` Razlog: ${order.otkazano_razlog}` : ""}
        </p>
      )}

      {(ratingKlijenta || ratingDostavljaca) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {ratingKlijenta && (
            <div className="rounded-lg border border-black/10 bg-white p-4 text-sm">
              <p className="font-medium">Ocena klijenta o dostavljaču</p>
              <p className="mt-1">
                {"★".repeat(ratingKlijenta.ocena)}
                {"☆".repeat(5 - ratingKlijenta.ocena)}
              </p>
              {ratingKlijenta.komentar && (
                <p className="mt-1 text-neutral-600">{ratingKlijenta.komentar}</p>
              )}
            </div>
          )}
          {ratingDostavljaca && (
            <div className="rounded-lg border border-black/10 bg-white p-4 text-sm">
              <p className="font-medium">Ocena dostavljača o klijentu</p>
              <p className="mt-1">
                {"★".repeat(ratingDostavljaca.ocena)}
                {"☆".repeat(5 - ratingDostavljaca.ocena)}
              </p>
              {ratingDostavljaca.komentar && (
                <p className="mt-1 text-neutral-600">{ratingDostavljaca.komentar}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
