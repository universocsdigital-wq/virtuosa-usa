import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";

const SQUARE_BASE_URL = "https://connect.squareup.com/v2";
const SQUARE_VERSION = "2024-01-18";

function getSquareToken(): string | null {
  return process.env.SQUARE_ACCESS_TOKEN || null;
}

function getLocationId(): string | null {
  return process.env.SQUARE_LOCATION_ID || process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || null;
}

function normalizeCategoryName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function resolveSquareCategoryId(categoryName: string, token: string): Promise<string | undefined> {
  if (!categoryName) return undefined;

  const response = await fetch(`${SQUARE_BASE_URL}/catalog/list?types=CATEGORY`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Square-Version": SQUARE_VERSION,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    console.warn("[admin/create-product] Categoria nao localizada no Square", await response.text().catch(() => ""));
    return undefined;
  }

  const data = await response.json();
  const target = normalizeCategoryName(categoryName);
  const match = (data.objects ?? []).find((object: { id?: string; category_data?: { name?: string } }) =>
    normalizeCategoryName(object.category_data?.name ?? "") === target
  );

  return match?.id;
}

export async function POST(req: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const token = getSquareToken();
  if (!token) {
    return NextResponse.json({ error: "Token do Square nao configurado." }, { status: 500 });
  }

  const locationId = getLocationId();
  if (!locationId) {
    return NextResponse.json({ error: "SQUARE_LOCATION_ID nao configurado." }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { name, description, price, category, color, sizes } = body;
    // sizes: Array<{ size: string; quantity: number }>

    const numericPrice = Number(price);
    if (typeof name !== "string" || !name.trim() || !Number.isFinite(numericPrice) || numericPrice <= 0 || !Array.isArray(sizes) || sizes.length === 0) {
      return NextResponse.json({ error: "Nome, preco e tamanhos sao obrigatorios." }, { status: 400 });
    }

    const idempotencyKey = `admin-create-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const priceInCents = Math.round(numericPrice * 100);
    const normalizedColor = typeof color === "string" ? color.trim().replace(/\s+/g, " ") : "";
    const normalizedSizes = sizes.map((s: { size: string; quantity: number }) => ({
      size: String(s.size || "").trim().toUpperCase(),
      quantity: Number(s.quantity),
    }));
    const uniqueSizes = new Set(normalizedSizes.map((s: { size: string }) => s.size));
    if (uniqueSizes.size !== normalizedSizes.length || normalizedSizes.some((s: { size: string; quantity: number }) => !s.size || !Number.isInteger(s.quantity) || s.quantity < 0)) {
      return NextResponse.json({ error: "Tamanhos duplicados ou quantidades invalidas." }, { status: 400 });
    }
    const categoryId = await resolveSquareCategoryId(category, token);

    // Criar variações para cada tamanho somente depois de validar toda a entrada.
    const variations = normalizedSizes.map((s: { size: string; quantity: number }, i: number) => ({
      type: "ITEM_VARIATION",
      id: `#variation-${i}`,
      item_variation_data: {
        name: normalizedColor ? `${normalizedColor} ${s.size}` : s.size,
        pricing_type: "FIXED_PRICING",
        price_money: {
          amount: priceInCents,
          currency: "USD",
        },
        location_overrides: [
          {
            location_id: locationId,
            track_inventory: true,
          },
        ],
      },
    }));

    // Criar o produto no Square
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
          id: "#new-item",
          item_data: {
            name,
            description: description || "",
            category_id: categoryId,
            variations,
          },
        },
      }),
      cache: "no-store",
    });

    if (!upsertResponse.ok) {
      const err = await upsertResponse.json().catch(() => ({}));
      return NextResponse.json({ error: JSON.stringify(err) }, { status: 400 });
    }

    const upsertData = await upsertResponse.json();
    const createdItem = upsertData.catalog_object;
    const createdVariations = createdItem?.item_data?.variations || [];

    // Definir estoque inicial para cada variação
    const inventoryChanges = createdVariations
      .map((v: { id: string }, i: number) => {
        const sizeEntry = normalizedSizes[i];
        if (!sizeEntry || sizeEntry.quantity <= 0) return null;
        return {
          type: "PHYSICAL_COUNT",
          physical_count: {
            catalog_object_id: v.id,
            location_id: locationId,
            state: "IN_STOCK",
            quantity: String(sizeEntry.quantity),
            occurred_at: new Date().toISOString(),
          },
        };
      })
      .filter(Boolean);

    if (inventoryChanges.length > 0) {
      await fetch(`${SQUARE_BASE_URL}/inventory/changes/batch-create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Square-Version": SQUARE_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idempotency_key: `${idempotencyKey}-inventory`,
          changes: inventoryChanges,
        }),
        cache: "no-store",
      });
    }

    return NextResponse.json({
      ok: true,
      productId: createdItem?.id,
      message: `Produto "${name}" criado com ${createdVariations.length} tamanho(s).`,
    });
  } catch (err) {
    console.error("[admin/create-product]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
