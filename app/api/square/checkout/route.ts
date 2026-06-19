import { NextResponse } from "next/server";
import { products } from "@/lib/data/products";

interface CheckoutItemInput {
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
}

export async function POST(request: Request) {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  const environment = process.env.SQUARE_ENVIRONMENT === "sandbox" ? "sandbox" : "production";

  if (!accessToken || !locationId) {
    return NextResponse.json(
      { error: "O checkout da Square está aguardando a configuração da loja." },
      { status: 503 }
    );
  }

  let body: { items?: CheckoutItemInput[] };
  try {
    body = (await request.json()) as { items?: CheckoutItemInput[] };
  } catch {
    return NextResponse.json({ error: "Sacola inválida." }, { status: 400 });
  }

  if (!body.items?.length) {
    return NextResponse.json({ error: "A sacola está vazia." }, { status: 400 });
  }

  const lineItems = body.items.map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    if (!product) throw new Error("Produto inválido na sacola.");

    const quantity = Math.max(1, Math.min(20, Math.floor(item.quantity)));
    const variation = [item.size && `Tamanho ${item.size}`, item.color].filter(Boolean).join(" · ");

    return {
      name: product.name,
      quantity: String(quantity),
      note: variation || undefined,
      base_price_money: {
        amount: Math.round(product.price * 100),
        currency: "USD",
      },
    };
  });

  const squareBaseUrl = environment === "sandbox" ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://virtuosausa.com";

  try {
    const squareResponse = await fetch(`${squareBaseUrl}/v2/online-checkout/payment-links`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Square-Version": process.env.SQUARE_API_VERSION ?? "2025-10-16",
      },
      body: JSON.stringify({
        idempotency_key: crypto.randomUUID(),
        order: {
          location_id: locationId,
          line_items: lineItems,
        },
        checkout_options: {
          ask_for_shipping_address: true,
          redirect_url: `${siteUrl}/checkout/sucesso`,
        },
      }),
      cache: "no-store",
    });

    const squareData = (await squareResponse.json()) as {
      payment_link?: { url?: string };
      errors?: { detail?: string }[];
    };

    if (!squareResponse.ok || !squareData.payment_link?.url) {
      const detail = squareData.errors?.[0]?.detail;
      return NextResponse.json({ error: detail ?? "A Square não conseguiu criar o checkout." }, { status: 502 });
    }

    return NextResponse.json({ checkoutUrl: squareData.payment_link.url });
  } catch {
    return NextResponse.json({ error: "Não foi possível conectar à Square. Tente novamente." }, { status: 502 });
  }
}
