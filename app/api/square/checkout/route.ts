import { NextResponse } from "next/server";
import { products } from "@/lib/data/products";

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
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  const environment = process.env.SQUARE_ENVIRONMENT === "sandbox" ? "sandbox" : "production";

  if (!accessToken || !locationId) {
    return NextResponse.json({ error: "O checkout da Square está aguardando a configuração da loja." }, { status: 503 });
  }

  let body: CheckoutRequest;
  try {
    body = (await request.json()) as CheckoutRequest;
  } catch {
    return NextResponse.json({ error: "Sacola inválida." }, { status: 400 });
  }

  if (!body.items?.length) return NextResponse.json({ error: "A sacola está vazia." }, { status: 400 });
  if (body.fulfillmentType !== "shipping" && body.fulfillmentType !== "pickup") {
    return NextResponse.json({ error: "Escolha envio ou retirada local." }, { status: 400 });
  }

  const lineItems: Array<{
    name: string;
    quantity: string;
    note?: string;
    base_price_money: { amount: number; currency: "USD" };
  }> = [];

  for (const item of body.items) {
    const product = products.find((candidate) => candidate.id === item.productId);
    if (!product || !product.inStock) return NextResponse.json({ error: "Um produto da sacola não está disponível." }, { status: 400 });

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

  const squareBaseUrl = environment === "sandbox" ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://virtuosausa.com";

  try {
    const squareResponse = await fetch(`${squareBaseUrl}/v2/online-checkout/payment-links`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Square-Version": process.env.SQUARE_API_VERSION ?? "2026-05-20",
      },
      body: JSON.stringify({
        idempotency_key: crypto.randomUUID(),
        order: { location_id: locationId, line_items: lineItems },
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
      const detail = squareData.errors?.[0]?.detail;
      return NextResponse.json({ error: detail ?? "A Square não conseguiu criar o checkout." }, { status: 502 });
    }

    return NextResponse.json({ checkoutUrl: squareData.payment_link.url, orderId: squareData.payment_link.order_id ?? "" });
  } catch {
    return NextResponse.json({ error: "Não foi possível conectar à Square. Tente novamente." }, { status: 502 });
  }
}
