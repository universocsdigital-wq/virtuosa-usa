import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";

const SQUARE_BASE_URL = "https://connect.squareup.com/v2";
const SQUARE_VERSION = "2024-01-18";

// Categorias reais do Square — Virtuosa USA
const CATEGORY_MAP: Record<string, string> = {
  vestidos:  "UD3ZVWMU77NJADQD2NYAPAV3",
  blusas:    "62F573XPBPCONBST54YVYB2S",
  conjuntos: "NN36IJ7XILTRUK5ECOONXUDT",
  saias:     "VCWVRPQKMGEKRUHFX6DKAB5C",
  calcas:    "AUIRQLYJUOMSXP5SWJSFMEHH",
  camisas:   "KRQTWZXAASI7ICCSPVD6QENW",
  casacos:   "NWB45JWJIHOWFFJ2C5HN6DWM",
  macacao:   "7GXK66KBOFA4PUWTUHTT4VIZ",
  lancamentos: "6WYVBDYKRO4C3B3K3HM2VJ6R",
  live:      "OKAXNQGTJCBMDA3QO53DHPPT",
};

// Item Option de Tamanho do Square — ID fixo da loja
const SIZE_OPTION_ID = "AJZKUIYMBALMYJ3E6BTQ7ROG";

function getSquareToken(): string | null {
  return process.env.SQUARE_ACCESS_TOKEN || null;
}

function getLocationId(): string | null {
  return process.env.SQUARE_LOCATION_ID || process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || null;
}

function normalizeCategory(cat: string): string {
  return cat
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
}

// Busca o item_option_value_id para um tamanho específico, ou cria se não existir
async function getOrCreateSizeOptionValue(
  token: string,
  sizeName: string,
  existingValues: Array<{ id: string; name: string }>
): Promise<string | null> {
  const existing = existingValues.find(
    (v) => v.name.toLowerCase() === sizeName.toLowerCase()
  );
  if (existing) return existing.id;

  // Criar novo valor de opção
  const res = await fetch(`${SQUARE_BASE_URL}/catalog/object`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Square-Version": SQUARE_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      idempotency_key: `size-val-${sizeName}-${Date.now()}`,
      object: {
        type: "ITEM_OPTION_VAL",
        id: `#size-val-${sizeName}`,
        item_option_value_data: {
          item_option_id: SIZE_OPTION_ID,
          name: sizeName,
        },
      },
    }),
    cache: "no-store",
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.catalog_object?.id ?? null;
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
    const { name, description, price, category, sizes } = body;
    // sizes: Array<{ size: string; quantity: number }>

    if (!name || !price || !sizes || sizes.length === 0) {
      return NextResponse.json({ error: "Nome, preco e tamanhos sao obrigatorios." }, { status: 400 });
    }

    // Resolver category_id
    const catKey = normalizeCategory(category || "");
    const categoryId = CATEGORY_MAP[catKey] ?? null;

    // Buscar valores de opção de tamanho existentes
    const optionRes = await fetch(
      `${SQUARE_BASE_URL}/catalog/object/${SIZE_OPTION_ID}?include_related_objects=true`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Square-Version": SQUARE_VERSION,
        },
        cache: "no-store",
      }
    );

    let existingValues: Array<{ id: string; name: string }> = [];
    if (optionRes.ok) {
      const optionData = await optionRes.json();
      const vals = optionData.related_objects?.filter(
        (o: { type: string }) => o.type === "ITEM_OPTION_VAL"
      ) ?? [];
      existingValues = vals.map((v: { id: string; item_option_value_data?: { name?: string } }) => ({
        id: v.id,
        name: v.item_option_value_data?.name ?? "",
      }));
    }

    const idempotencyKey = `admin-create-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const priceInCents = Math.round(parseFloat(price) * 100);

    // Resolver item_option_value_id para cada tamanho
    const variationsWithOptionValues: Array<{
      size: string;
      quantity: number;
      optionValueId: string | null;
    }> = await Promise.all(
      sizes.map(async (s: { size: string; quantity: number }) => {
        const optionValueId = await getOrCreateSizeOptionValue(token, s.size, existingValues);
        return { ...s, optionValueId };
      })
    );

    // Criar variações no formato correto do Square
    const variations = variationsWithOptionValues.map((s, i) => ({
      type: "ITEM_VARIATION",
      id: `#variation-${i}`,
      item_variation_data: {
        name: s.size,
        pricing_type: "FIXED_PRICING",
        price_money: {
          amount: priceInCents,
          currency: "USD",
        },
        location_overrides: [
          {
            location_id: locationId,
            track_inventory: true,
            inventory_alert_type: "LOW_QUANTITY",
            inventory_alert_threshold: 1,
          },
        ],
        ...(s.optionValueId
          ? {
              item_option_values: [
                {
                  item_option_id: SIZE_OPTION_ID,
                  item_option_value_id: s.optionValueId,
                },
              ],
            }
          : {}),
      },
    }));

    // Montar item_data com categoria e item_options
    const itemData: Record<string, unknown> = {
      name,
      description: description || "",
      variations,
      item_options: [{ item_option_id: SIZE_OPTION_ID }],
      ecom_visibility: "VISIBLE",
    };

    if (categoryId) {
      itemData.categories = [{ id: categoryId }];
      itemData.reporting_category = { id: categoryId };
    }

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
          present_at_location_ids: [locationId],
          item_data: itemData,
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
        const sizeEntry = sizes[i];
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
