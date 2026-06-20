import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function verifySignature(rawBody: string, signature: string, signatureKey: string, notificationUrl: string) {
  const expected = createHmac("sha256", signatureKey)
    .update(notificationUrl + rawBody)
    .digest("base64");
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  return expectedBuffer.length === signatureBuffer.length && timingSafeEqual(expectedBuffer, signatureBuffer);
}

export async function POST(request: Request) {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (!signatureKey) {
    console.error("[Square webhook] SQUARE_WEBHOOK_SIGNATURE_KEY não configurada.");
    return NextResponse.json({ error: "Webhook não configurado." }, { status: 503 });
  }

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

  if (event.type === "payment.completed") {
    const payment = event.data?.object?.payment as Record<string, unknown> | undefined;
    console.info("[Square webhook] Pagamento concluído.", {
      paymentId: payment?.id,
      orderId: payment?.order_id,
    });
  }

  if (event.type === "payment.canceled" || event.type === "order.canceled") {
    console.info("[Square webhook] Pedido cancelado.", { type: event.type });
  }

  return NextResponse.json({ received: true });
}
