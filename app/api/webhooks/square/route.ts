import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { upsertSupabaseOrder } from "@/lib/supabase.server";

export const runtime = "nodejs";

function verifySignature(rawBody: string, signature: string, signatureKey: string, notificationUrl: string) {
  const expected = createHmac("sha256", signatureKey).update(notificationUrl + rawBody).digest("base64");
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  return expectedBuffer.length === signatureBuffer.length && timingSafeEqual(expectedBuffer, signatureBuffer);
}

async function getSquareOrder(orderId: string) {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) return null;
  const baseUrl = process.env.SQUARE_ENVIRONMENT === "sandbox" ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
  const response = await fetch(`${baseUrl}/v2/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}`, "Square-Version": process.env.SQUARE_API_VERSION ?? "2025-10-16" },
    cache: "no-store",
  });
  if (!response.ok) return null;
  return ((await response.json()) as { order?: Record<string, unknown> }).order ?? null;
}

function getOrderDetails(order: Record<string, unknown> | null) {
  const fulfillments = (order?.fulfillments as Array<Record<string, unknown>> | undefined) ?? [];
  const shipment = fulfillments.find((item) => item.type === "SHIPMENT");
  const shipmentDetails = shipment?.shipment_details as Record<string, unknown> | undefined;
  const recipient = shipmentDetails?.recipient as Record<string, unknown> | undefined;
  return {
    email: String(recipient?.email_address ?? "").toLowerCase(),
    trackingNumber: String(shipmentDetails?.tracking_number ?? ""),
    carrier: String(shipmentDetails?.shipping_note ?? "USPS"),
    items: (order?.line_items as unknown[]) ?? [],
    fulfillmentState: String(shipment?.state ?? ""),
  };
}

export async function POST(request: Request) {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (!signatureKey) return NextResponse.json({ error: "Webhook não configurado." }, { status: 503 });

  const rawBody = await request.text();
  const signature = request.headers.get("x-square-hmacsha256-signature") ?? "";
  const notificationUrl = process.env.SQUARE_WEBHOOK_NOTIFICATION_URL ?? "https://www.virtuosausa.com/api/webhooks/square";
  if (!signature || !verifySignature(rawBody, signature, signatureKey, notificationUrl)) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(rawBody) as typeof event;
  } catch {
    return NextResponse.json({ error: "Evento inválido." }, { status: 400 });
  }

  try {
    if (event.type === "payment.completed") {
      const payment = event.data?.object?.payment as Record<string, unknown> | undefined;
      const orderId = String(payment?.order_id ?? "");
      const squareOrder = orderId ? await getSquareOrder(orderId) : null;
      const details = getOrderDetails(squareOrder);
      const amount = payment?.amount_money as Record<string, unknown> | undefined;
      const customerEmail = String(payment?.buyer_email_address ?? details.email ?? "").toLowerCase();

      if (orderId) {
        await upsertSupabaseOrder({
          square_order_id: orderId,
          square_payment_id: String(payment?.id ?? ""),
          customer_email: customerEmail || null,
          status: "paid",
          amount_cents: Number(amount?.amount ?? 0),
          tracking_number: details.trackingNumber || null,
          carrier: details.carrier || "USPS",
          items: details.items,
          updated_at: new Date().toISOString(),
        });
      }
    }

    if (event.type === "payment.canceled" || event.type === "order.canceled") {
      const object = event.data?.object ?? {};
      const payment = object.payment as Record<string, unknown> | undefined;
      const order = object.order as Record<string, unknown> | undefined;
      const orderId = String(payment?.order_id ?? order?.id ?? "");
      if (orderId) await upsertSupabaseOrder({ square_order_id: orderId, status: "canceled", updated_at: new Date().toISOString() });
    }

    if (event.type === "order.fulfillment.updated") {
      const object = event.data?.object ?? {};
      const fulfillmentUpdate = object.order_fulfillment_updated as Record<string, unknown> | undefined;
      const embeddedOrder = object.order as Record<string, unknown> | undefined;
      const orderId = String(fulfillmentUpdate?.order_id ?? embeddedOrder?.id ?? "");

      if (orderId) {
        const squareOrder = await getSquareOrder(orderId);
        const details = getOrderDetails(squareOrder);
        const update: Record<string, unknown> = {
          square_order_id: orderId,
          status: details.trackingNumber || details.fulfillmentState === "COMPLETED" ? "shipped" : "processing",
          updated_at: new Date().toISOString(),
        };
        if (details.email) update.customer_email = details.email;
        if (details.trackingNumber) update.tracking_number = details.trackingNumber;
        if (details.carrier) update.carrier = details.carrier;
        if (details.items.length) update.items = details.items;
        await upsertSupabaseOrder(update);
      }
    }
  } catch (error) {
    console.error("[Square webhook] O evento foi validado, mas não pôde ser salvo.", error);
  }

  return NextResponse.json({ received: true });
}
