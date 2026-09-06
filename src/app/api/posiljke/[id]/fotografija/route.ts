import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getShipmentById } from "@/lib/queries/shipments";
import { getOrderByShipmentId } from "@/lib/queries/orders";
import { getShipmentFotografijaFile } from "@/lib/queries/shipment-fotografije";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }

  const shipment = await getShipmentById(id);
  if (!shipment) {
    return NextResponse.json({ error: "Pošiljka nije pronađena." }, { status: 404 });
  }

  let allowed = user.role === "OPERATOR";
  if (!allowed && user.role === "CLIENT") {
    allowed = shipment.client_id === user.companyId;
  }
  if (!allowed && user.role === "COURIER") {
    const order = await getOrderByShipmentId(id);
    allowed = order?.courier_id === user.courierId;
  }
  if (!allowed) {
    return NextResponse.json({ error: "Nemate pristup." }, { status: 403 });
  }

  const file = await getShipmentFotografijaFile(id);
  if (!file) {
    return NextResponse.json({ error: "Fotografija nije postavljena." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.sadrzaj), {
    headers: { "Content-Type": file.content_type },
  });
}
