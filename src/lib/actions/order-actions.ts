"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../auth";
import { advanceOrder } from "../queries/orders";

export async function advanceOrderAction(
  orderId: string
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "COURIER" || !user.courierId) {
    return { error: "Morate biti prijavljeni kao dostavljač." };
  }

  try {
    await advanceOrder(orderId, user.courierId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Greška." };
  }

  revalidatePath("/dostavljac/aktivne");
  revalidatePath("/klijent");
  return {};
}
