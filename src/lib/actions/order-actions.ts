"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../auth";
import { advanceOrder, cancelOrder } from "../queries/orders";
import { uploadShipmentFotografija } from "../queries/shipment-fotografije";
import { getClientUserIdForShipment } from "../queries/shipments";
import { isImageFile, MAX_IMAGE_SIZE_BYTES } from "../validation";
import { sendPushToUser } from "../push";

export async function advanceOrderAction(
  orderId: string,
  formData?: FormData
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "COURIER" || !user.courierId) {
    return { error: "Morate biti prijavljeni kao dostavljač." };
  }

  // Validiramo fotografiju PRE nego što se status porudžbine promeni, da
  // korisnik ne ostane sa (tiho) naprednovanim statusom a odbijenom slikom.
  const rawFile = formData?.get("fotografija");
  const photoFile: File | null =
    rawFile instanceof File && rawFile.size > 0 ? rawFile : null;
  if (photoFile) {
    if (!isImageFile(photoFile)) {
      return { error: "Fotografija mora biti slika (JPG, PNG i sl.)." };
    }
    if (photoFile.size > MAX_IMAGE_SIZE_BYTES) {
      return { error: "Fotografija je prevelika (maksimum 8 MB)." };
    }
  }

  let order;
  try {
    order = await advanceOrder(orderId, user.courierId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Greška." };
  }

  if (photoFile) {
    const buffer = Buffer.from(await photoFile.arrayBuffer());
    await uploadShipmentFotografija(
      order.shipment_id,
      buffer,
      photoFile.type || "image/jpeg"
    );
  }

  // Faza 21: push klijentu o napretku porudžbine. Namerno NEMA push-a na
  // sam trenutak prihvatanja ponude (status 'PREUZETO') — to je direktna
  // posledica klijentovog sopstvenog klika na "Prihvati", pa bi push tu
  // bio suvišan; pravi, korisni trenuci su kad DOSTAVLJAČ pomeri status
  // (klijent inače nema drugi način da to sazna osim da sam proveri app).
  const STATUS_PUSH_PORUKE: Partial<Record<typeof order.status, string>> = {
    U_TRANZITU: "Dostavljač je preuzeo vašu pošiljku — u tranzitu je.",
    ISPORUCENO: "Vaša pošiljka je isporučena.",
  };
  const poruka = STATUS_PUSH_PORUKE[order.status];
  if (poruka) {
    const clientUserId = await getClientUserIdForShipment(order.shipment_id);
    if (clientUserId) {
      await sendPushToUser(clientUserId, {
        title: "Ruta-Dostava",
        body: poruka,
        url: `/klijent/posiljke/${order.shipment_id}`,
      });
    }
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
