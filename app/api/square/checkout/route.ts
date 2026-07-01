import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { durableRateLimit, getClientIp } from "@/lib/rate-limit";
import { getSquareProducts } from "@/lib/square";

const SHIPPING_CENTS = 1200;

interface CheckoutItemInput {
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
}

interface CheckoutRequest {
  items?: CheckoutItemInput[];
  fulfillmentType?: "shipping" | "pickup";
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 32_768) {
    return NextResponse.json({ error: "A sacola excedeu o tamanho permitido." }, { status: 413 });
  }

  const clientIp = getClientIp(request);
  const checkoutLimit = await durableRateLimit({
    namespace: "square-checkout-ip",
    identifier: clientIp,
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });

  if (!checkoutLimit.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas de checkout. Aguarde e tente novamente." },
      { status: 429, headers: { "Retry-After": String(checkoutLimit.retryAfter) } },
    );
  }

  const accessToken =
    process.env.SQUARE_ACCESS_TOKEN ||
    process.env["LOCALIZAÇÃO_QUADRADA_"] ||
    process.env.LOCALIZACAO_QUADRADA_;

  const locationId =
    process.env.SQUARE_LOCATION_ID ||
    process.env["IO_DA_LOCALIZAÇÃO_QUADRADA"] ||
    process.env.IO_DA_LOCALIZACAO_QUADRADA;

  const environment =
    (process.env.SQUARE_ENVIRONMENT || process.env["SQUARE_E_IRONMENT"] || "production") === "sandbox"
      ? "sandbox"
      : "production";

  if (!accessToken || !locationId) {
    return NextResponse.json(
      { error: "O checkout da Square está aguardando a configuração da loja." },
      { status: 503 },
    );
  }

  let body: CheckoutRequest;
  try {
    body = (await request.json()) as CheckoutRequest;
  } catch {
    return NextResponse.json({ error: "Sacola inválida." }, { status: 400 });
  }

  if (!body.items?.length) return NextResponse.json({ error: "A sacola está vazia." }, { status: 400 });
  if (body.items.length > 20) return NextResponse.json({ error: "A sacola possui itens demais." }, { status: 400 });
  if (body.fulfillmentType !== "shipping" && body.fulfillmentType !== "pickup") {
    return NextResponse.json({ error: "Escolha envio ou retirada local." }, { status: 400 });
  }

  let allProducts;
  try {
    allProducts = await getSquareProducts();
  } catch {
    return NextResponse.json(
      { error: "Não foi possível verificar os produtos. Tente novamente." },
      { status: 502 },
    );
  }

  const lineItems: Array<{
    name: string;
    quantity: string;
    note?: string;
    base_price_money: { amount: number; currency: "USD" };
  }> = [];

  for (const item of body.items) {
    const product = allProducts.find((candidate) => candidate.id === item.productId);

    if (!product) {
      return NextResponse.json(
        { error: "Um produto da sacola não está mais disponível. Atualize a página e tente novamente." },
        { status: 400 },
      );
    }

    const quantity = Math.floor(item.quantity);
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 20) {
      return NextResponse.json({ error: `Quantidade inválida para ${product.name}.` }, { status: 400 });
    }

    if (product.sizes?.length && (!item.size || !product.sizes.includes(item.size))) {
      return NextResponse.json({ error: `Escolha um tamanho válido para ${product.name}.` }, { status: 400 });
    }

    if (product.colors?.length && (!item.color || !product.colors.includes(item.color))) {
      return NextResponse.json({ error: `Escolha uma cor válida para ${product.name}.` }, { status: 400 });
    }

    const variation = [item.size && `Tamanho ${item.size}`, item.color].filter(Boolean).join(" · ");

    lineItems.push({
      name: product.name,
      quantity: String(quantity),
      note: variation || undefined,
      base_price_money: { amount: Math.round(product.price * 100), currency: "USD" },
    });
  }

  if (body.fulfillmentType === "shipping") {
    lineItems.push({
      name: "Frete USPS — envio com rastreamento",
      quantity: "1",
      base_price_money: { amount: SHIPPING_CENTS, currency: "USD" },
    });
  }

  const idempotencyPayload = JSON.stringify({
    clientIp,
    fulfillmentType: body.fulfillmentType,
    items: body.items
      .map(({ productId, quantity, size, color }) => ({ productId, quantity, size: size ?? "", color: color ?? "" }))
      .sort((a, b) => `${a.productId}:${a.size}:${a.color}`.localeCompare(`${b.productId}:${b.size}:${b.color}`)),
    timeBucket: Math.floor(Date.now() / (10 * 60 * 1000)),
  });
  const idempotencyKey = createHash("sha256").update(idempotencyPayload).digest("hex");
  const squareBaseUrl = environment === "sandbox" ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env["URL_SUPABASE"]?.replace("supabase", "virtuosausa") ||
    "https://virtuosausa.com";

  try {
    const squareResponse = await fetch(`${squareBaseUrl}/v2/online-checkout/payment-links`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Square-Version": process.env.SQUARE_API_VERSION ?? "2026-05-20",
      },
      body: JSON.stringify({
        idempotency_key: idempotencyKey,
        order: {
          location_id: locationId,
          line_items: lineItems,
        },
        checkout_options: {
          ask_for_shipping_address: body.fulfillmentType === "shipping",
          redirect_url: `${siteUrl}/checkout/sucesso`,
          accepted_payment_methods: {
            apple_pay: true,
            google_pay: true,
            cash_app_pay: true,
            afterpay_clearpay: false,
          },
        },
        payment_note: `Virtuosa USA — ${body.fulfillmentType === "shipping" ? "Envio USPS" : "Retirada local"}`,
      }),
      cache: "no-store",
    });

    const squareData = (await squareResponse.json()) as {
      payment_link?: { url?: string; order_id?: string };
      errors?: { detail?: string }[];
    };

    if (!squareResponse.ok || !squareData.payment_link?.url) {
      return NextResponse.json(
        { error: squareData.errors?.[0]?.detail ?? "A Square não conseguiu criar o checkout." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      checkoutUrl: squareData.payment_link.url,
      orderId: squareData.payment_link.order_id ?? "",
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível conectar à Square. Tente novamente." },
      { status: 502 },
    );
  }
}
