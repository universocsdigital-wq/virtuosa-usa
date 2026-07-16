import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { revalidateStorefront } from "@/lib/store-cache";

const SQUARE_BASE_URL = "https://connect.squareup.com/v2";
const SQUARE_VERSION = "2024-01-18";
const ALLOWED_SIZES = new Set(["PP", "P", "M", "G", "GG", "XG", "XGG", "U"]);
const SIZE_PATTERN = /\b(PP|P|M|G|GG|XG|XGG|U)\b/i;

interface SquareVariation {
  id: string;
  version?: number;
  item_variation_data?: {
    name?: string;
    price_money?: { amount?: number; currency?: string };
    item_option_values?: unknown[];
    [key: string]: unknown;
  };
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function variationMatches(variationName: string, size: string, color?: string): boolean {
  const currentSize = variationName.match(SIZE_PATTERN)?.[1]?.toUpperCase() ?? "U";
  if (currentSize !== size) return false;
  if (!color) return true;
  const currentColor = variationName.replace(SIZE_PATTERN, "").replace(/\s+/g, " ").trim();
  return normalize(currentColor) === normalize(color);
}

export async function POST(request: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const token = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID || process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
  if (!token || !locationId) {
    return NextResponse.json({ error: "Square nao configurado." }, { status: 500 });
  }

  try {
    const { productId, slug, size, color, quantity } = await request.json();
    const normalizedSize = String(size || "").trim().toUpperCase();
    const normalizedColor = typeof color === "string" ? color.trim().replace(/\s+/g, " ") : "";
    const numericQuantity = Number(quantity);

    if (!productId || !ALLOWED_SIZES.has(normalizedSize)) {
      return NextResponse.json({ error: "Escolha um tamanho valido." }, { status: 400 });
    }
    if (!Number.isInteger(numericQuantity) || numericQuantity < 0) {
      return NextResponse.json({ error: "A quantidade deve ser um numero inteiro igual ou maior que zero." }, { status: 400 });
    }

    const currentResponse = await fetch(
      `${SQUARE_BASE_URL}/catalog/object/${encodeURIComponent(productId)}?include_related_objects=true`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Square-Version": SQUARE_VERSION,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );
    if (!currentResponse.ok) {
      return NextResponse.json({ error: "Produto nao encontrado no Square." }, { status: 404 });
    }

    const currentData = await currentResponse.json();
    const item = currentData.object;
    const variations = (item?.item_data?.variations ?? []) as SquareVariation[];
    if (!item?.id || variations.length === 0) {
      return NextResponse.json({ error: "Produto sem variacoes validas no Square." }, { status: 400 });
    }
    if (variations.some((variation) => variationMatches(variation.item_variation_data?.name ?? "", normalizedSize, normalizedColor || undefined))) {
      return NextResponse.json({ error: `O tamanho ${normalizedSize} ja existe neste produto.` }, { status: 409 });
    }
    if (variations.some((variation) => (variation.item_variation_data?.item_option_values?.length ?? 0) > 0)) {
      return NextResponse.json(
        { error: "Este produto usa opcoes estruturadas do Square. Adicione o tamanho diretamente nas opcoes do Square para evitar inconsistencia." },
        { status: 409 }
      );
    }

    const firstPrice = variations.find((variation) => variation.item_variation_data?.price_money?.amount)?.item_variation_data?.price_money;
    if (!firstPrice?.amount) {
      return NextResponse.json({ error: "O produto nao possui preco valido no Square." }, { status: 400 });
    }

    const variationName = normalizedColor ? `${normalizedColor} ${normalizedSize}` : normalizedSize;
    const existingIds = new Set(variations.map((variation) => variation.id));
    const idempotencyKey = `admin-add-size-${productId}-${normalizedSize}-${Date.now()}`;
    const upsertResponse = await fetch(`${SQUARE_BASE_URL}/catalog/object`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Square-Version": SQUARE_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idempotency_key: idempotencyKey,
        object: {
          type: "ITEM",
          id: item.id,
          version: item.version,
          item_data: {
            ...item.item_data,
            variations: [
              ...variations,
              {
                type: "ITEM_VARIATION",
                id: "#new-size",
                item_variation_data: {
                  name: variationName,
                  pricing_type: "FIXED_PRICING",
                  price_money: {
                    amount: firstPrice.amount,
                    currency: firstPrice.currency || "USD",
                  },
                  location_overrides: [{ location_id: locationId, track_inventory: true }],
                },
              },
            ],
          },
        },
      }),
      cache: "no-store",
    });

    if (!upsertResponse.ok) {
      const error = await upsertResponse.json().catch(() => ({}));
      return NextResponse.json({ error: JSON.stringify(error) }, { status: 400 });
    }

    const upsertData = await upsertResponse.json();
    const updatedVariations = (upsertData.catalog_object?.item_data?.variations ?? []) as SquareVariation[];
    const createdVariation = updatedVariations.find((variation) => !existingIds.has(variation.id));
    if (!createdVariation?.id) {
      return NextResponse.json({ error: "O Square nao confirmou a criacao do novo tamanho." }, { status: 400 });
    }

    const inventoryResponse = await fetch(`${SQUARE_BASE_URL}/inventory/changes/batch-create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Square-Version": SQUARE_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idempotency_key: `${idempotencyKey}-inventory`,
        changes: [
          {
            type: "PHYSICAL_COUNT",
            physical_count: {
              catalog_object_id: createdVariation.id,
              location_id: locationId,
              state: "IN_STOCK",
              quantity: String(numericQuantity),
              occurred_at: new Date().toISOString(),
            },
          },
        ],
      }),
      cache: "no-store",
    });

    if (!inventoryResponse.ok) {
      await fetch(`${SQUARE_BASE_URL}/catalog/object/${encodeURIComponent(createdVariation.id)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Square-Version": SQUARE_VERSION,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }).catch(() => undefined);
      return NextResponse.json({ error: "O Square nao confirmou o estoque inicial; o novo tamanho foi cancelado." }, { status: 400 });
    }

    revalidateStorefront(typeof slug === "string" ? slug : undefined);
    return NextResponse.json({
      ok: true,
      size: normalizedSize,
      quantity: numericQuantity,
      message: `Tamanho ${normalizedSize} criado no Square com ${numericQuantity} unidade(s).`,
    });
  } catch (error) {
    console.error("[admin/add-size]", error);
    return NextResponse.json({ error: "Nao foi possivel adicionar o tamanho." }, { status: 500 });
  }
}
