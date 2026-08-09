import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { durableRateLimit, getClientIp } from "@/lib/rate-limit";
import { getSquareProducts, getSquareVariationId } from "@/lib/square";
import { normalizeCouponCode, validateCoupon } from "@/lib/coupons";
import { getSiteUrl } from "@/lib/site-url";

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
  couponCode?: string;
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
    process.env["LOCALIZAÃ‡ÃƒO_QUADRADA_"] ||
    process.env.LOCALIZACAO_QUADRADA_;

  const locationId =
    process.env.SQUARE_LOCATION_ID ||
    process.env["IO_DA_LOCALIZAÃ‡ÃƒO_QUADRADA"] ||
    process.env.IO_DA_LOCALIZACAO_QUADRADA;

  const environment =
    (process.env.SQUARE_ENVIRONMENT || process.env["SQUARE_E_IRONMENT"] || "production") === "sandbox"
      ? "sandbox"
      : "production";

  if (!accessToken || !locationId) {
    return NextResponse.json(
      { error: "O checkout da Square estÃ¡ aguardando a configuraÃ§Ã£o da loja." },
      { status: 503 },
    );
  }

  let body: CheckoutRequest;
  try {
    body = (await request.json()) as CheckoutRequest;
  } catch {
    return NextResponse.json({ error: "Sacola invÃ¡lida." }, { status: 400 });
  }

  if (!body.items?.length) return NextResponse.json({ error: "A sacola estÃ¡ vazia." }, { status: 400 });
  if (body.items.length > 20) return NextResponse.json({ error: "A sacola possui itens demais." }, { status: 400 });
  if (body.fulfillmentType !== "shipping" && body.fulfillmentType !== "pickup") {
    return NextResponse.json({ error: "Escolha envio ou retirada local." }, { status: 400 });
  }

  let allProducts;
  try {
    allProducts = await getSquareProducts();
  } catch {
    return NextResponse.json(
      { error: "NÃ£o foi possÃ­vel verificar os produtos. Tente novamente." },
      { status: 502 },
    );
  }

  const lineItems: Array<{
    quantity: string;
    catalog_object_id: string;
    note?: string;
  }> = [];
  const serviceCharges: Array<{
    name: string;
    amount_money: { amount: number; currency: "USD" };
    calculation_phase: "TOTAL_PHASE";
    taxable: boolean;
  }> = [];
  let subtotalCents = 0;
  for (const item of body.items) {
    const product = allProducts.find(
      (candidate) => candidate.id === item.productId || candidate.sourceProductId === item.productId
    );

    if (!product) {
      return NextResponse.json(
        { error: "Um produto da sacola nÃ£o estÃ¡ mais disponÃ­vel. Atualize a pÃ¡gina e tente novamente." },
        { status: 400 },
      );
    }

    const quantity = Math.floor(item.quantity);
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 20) {
      return NextResponse.json({ error: `Quantidade invÃ¡lida para ${product.name}.` }, { status: 400 });
    }

    if (product.sizes?.length && (!item.size || !product.sizes.includes(item.size))) {
      return NextResponse.json({ error: `Escolha um tamanho vÃ¡lido para ${product.name}.` }, { status: 400 });
    }

    if (product.colors?.length && (!item.color || !product.colors.includes(item.color))) {
      return NextResponse.json({ error: `Escolha uma cor vÃ¡lida para ${product.name}.` }, { status: 400 });
    }
    const availableQuantity =
      item.size && item.color && product.inventoryByColorSize?.[item.color]
        ? product.inventoryByColorSize[item.color][item.size] ?? 0
        : item.size && product.inventoryBySize
        ? product.inventoryBySize[item.size] ?? 0
        : undefined;

    if (availableQuantity !== undefined) {
      if (availableQuantity <= 0) {
        return NextResponse.json(
          { error: `${product.name} está sem estoque nessa combinação.` },
          { status: 400 }
        );
      }
      if (quantity > availableQuantity) {
        return NextResponse.json(
          { error: `Temos apenas ${availableQuantity} unidade(s) de ${product.name} nessa combinação.` },
          { status: 400 },
        );
      }
    }

    const variation = [item.size && `Tamanho ${item.size}`, item.color].filter(Boolean).join(" Â· ");
    const variationId = await getSquareVariationId(
      product.sourceProductId ?? product.id,
      item.size ?? "U",
      item.color,
    );

    if (!variationId) {
      return NextResponse.json(
        { error: `A variacao de ${product.name} nao foi encontrada no Square. Atualize a pagina e tente novamente.` },
        { status: 400 },
      );
    }

    lineItems.push({
      quantity: String(quantity),
      catalog_object_id: variationId,
      note: variation || undefined,
    });
    subtotalCents += Math.round(product.price * 100) * quantity;
  }

  const normalizedCoupon = normalizeCouponCode(body.couponCode ?? "");
  const couponValidation = normalizedCoupon
    ? validateCoupon(normalizedCoupon, subtotalCents, body.fulfillmentType)
    : null;
  if (couponValidation && !couponValidation.valid) {
    return NextResponse.json({ error: couponValidation.error || "Cupom invalido." }, { status: 400 });
  }
  const activeCoupon = couponValidation?.coupon;
  const freeShipping = activeCoupon?.kind === "free_shipping";
  const discounts = activeCoupon?.kind === "fixed_amount"
    ? [{
        uid: "coupon-discount",
        name: `Cupom ${activeCoupon.code}`,
        amount_money: { amount: activeCoupon.amountCents, currency: "USD" as const },
        scope: "ORDER" as const,
      }]
    : activeCoupon?.kind === "percentage"
      ? [{
          uid: "coupon-discount",
          name: `Cupom ${activeCoupon.code}`,
          type: "FIXED_PERCENTAGE" as const,
          percentage: String(activeCoupon.percentage ?? 0),
          scope: "ORDER" as const,
        }]
      : [];

  if (body.fulfillmentType === "shipping" && !freeShipping) {
    serviceCharges.push({
      name: "Envio",
      amount_money: { amount: SHIPPING_CENTS, currency: "USD" },
      calculation_phase: "TOTAL_PHASE",
      taxable: false,
    });
  }

  const idempotencyPayload = JSON.stringify({
    checkoutVersion: "catalog-v3-coupons",
    clientIp,
    fulfillmentType: body.fulfillmentType,
    couponCode: activeCoupon?.code ?? "",
    items: body.items
      .map(({ productId, quantity, size, color }) => ({ productId, quantity, size: size ?? "", color: color ?? "" }))
      .sort((a, b) => `${a.productId}:${a.size}:${a.color}`.localeCompare(`${b.productId}:${b.size}:${b.color}`)),
    timeBucket: Math.floor(Date.now() / (10 * 60 * 1000)),
  });
  const idempotencyKey = createHash("sha256").update(idempotencyPayload).digest("hex");
  const squareBaseUrl = environment === "sandbox" ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
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
          ...(serviceCharges.length > 0 ? { service_charges: serviceCharges } : {}),
          ...(discounts.length > 0 ? { discounts } : {}),
          pricing_options: {
            auto_apply_discounts: false,
            auto_apply_taxes: true,
          },
        },
        checkout_options: {
          ask_for_shipping_address: body.fulfillmentType === "shipping",
          enable_coupon: false,
          redirect_url: getSiteUrl("/checkout/sucesso"),
          accepted_payment_methods: {
            apple_pay: true,
            google_pay: true,
            cash_app_pay: true,
            afterpay_clearpay: true,
          },
        },
        payment_note: `Virtuosa USA - ${body.fulfillmentType === "shipping" ? "Envio" : "Retirada local"}${activeCoupon ? ` - Cupom ${activeCoupon.code}` : ""}`,
      }),
      cache: "no-store",
    });

    const squareData = (await squareResponse.json()) as {
      payment_link?: { url?: string; order_id?: string };
      errors?: { detail?: string }[];
    };

    if (!squareResponse.ok || !squareData.payment_link?.url) {
      return NextResponse.json(
        { error: squareData.errors?.[0]?.detail ?? "A Square nÃ£o conseguiu criar o checkout." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      checkoutUrl: squareData.payment_link.url,
      orderId: squareData.payment_link.order_id ?? "",
    });
  } catch {
    return NextResponse.json(
      { error: "NÃ£o foi possÃ­vel conectar Ã  Square. Tente novamente." },
      { status: 502 },
    );
  }
}

