"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../auth";
import { advanceOrder, cancelOrder } from "../queries/orders";
import { uploadShipmentFotografija } from "../queries/shipment-fotografije";

export async function advanceOrderAction(
  orderId: string,
  formData?: FormData
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "COURIER" || !user.courierId) {
    return { error: "Morate biti prijavljeni kao dostavljač." };
  }

  let order;
  try {
    order = await advanceOrder(orderId, user.courierId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Greška." };
  }

  const file = formData?.get("fotografija");
  if (file instanceof File && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadShipmentFotografija(
      order.shipment_id,
      buffer,
      file.type || "image/jpeg"
    );
  }

  revalidatePath("/dostavljac/aktivne");
  revalidatePath("/klijent");
  return {};
}

export async function cancelOrderAction(
  orderId: string,
  razlog?: string
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "COURIER" && user.role !== "CLIENT")) {
    return { error: "Morate biti prijavljeni." };
  }

  try {
    await cancelOrder(
      orderId,
      { courierId: user.courierId ?? undefined, clientId: user.companyId ?? undefined },
      razlog
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Greška." };
  }

  revalidatePath("/dostavljac/aktivne");
  revalidatePath("/klijent");
  return {};
}
