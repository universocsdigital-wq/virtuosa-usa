import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { revalidateStorefront } from "@/lib/store-cache";

const SQUARE_BASE_URL = "https://connect.squareup.com/v2";
const SQUARE_VERSION = "2024-01-18";

function getSquareToken(): string | null {
  return process.env.SQUARE_ACCESS_TOKEN || null;
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
    throw new Error(`Nao foi possivel consultar as categorias do Square: ${response.status}`);
  }

  const data = await response.json();
  const target = normalizeCategoryName(categoryName);
  const match = (data.objects ?? []).find((object: { id?: string; category_data?: { name?: string } }) =>
    normalizeCategoryName(object.category_data?.name ?? "") === target
  );

  if (match?.id) return match.id;

  const categoryResponse = await fetch(`${SQUARE_BASE_URL}/catalog/object`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Square-Version": SQUARE_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      idempotency_key: `admin-category-${target}-${Date.now()}`,
      object: {
        type: "CATEGORY",
        id: "#new-category",
        category_data: { name: categoryName.trim() },
      },
    }),
    cache: "no-store",
  });

  if (!categoryResponse.ok) {
    throw new Error(`Nao foi possivel criar a categoria "${categoryName}" no Square.`);
  }

  const categoryData = await categoryResponse.json();
  return categoryData.catalog_object?.id;
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

  try {
    const body = await req.json();
    const { productId, name, description, price, category, isLaunch, color: requestedColor } = body;
    let color = requestedColor;

    if (!productId) {
      return NextResponse.json({ error: "productId e obrigatorio." }, { status: 400 });
    }

    // Buscar o objeto atual para obter version e variações
    const fetchResponse = await fetch(
      `${SQUARE_BASE_URL}/catalog/object/${productId}?include_related_objects=true`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Square-Version": SQUARE_VERSION,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!fetchResponse.ok) {
      const err = await fetchResponse.json().catch(() => ({}));
      return NextResponse.json({ error: JSON.stringify(err) }, { status: 400 });
    }

    const fetchData = await fetchResponse.json();
    const existingObject = fetchData.object;

    if (!existingObject) {
      return NextResponse.json({ error: "Produto nao encontrado." }, { status: 404 });
    }
    const numericPrice = price === undefined ? undefined : Number(price);
    if (numericPrice !== undefined && (!Number.isFinite(numericPrice) || numericPrice <= 0)) {
      return NextResponse.json({ error: "Preco invalido." }, { status: 400 });
    }

    const existingVariations = (existingObject.item_data?.variations || []) as Array<{
      id: string;
      version: number;
      item_variation_data: Record<string, unknown> & { item_option_values?: unknown[] };
    }>;
    if (color !== undefined && existingVariations.some((variation) => (variation.item_variation_data.item_option_values?.length ?? 0) > 0)) {
      const requested = String(color).trim().replace(/\s+/g, " ").toLowerCase();
      const existingColors = new Set(existingVariations.map((variation) =>
        String(variation.item_variation_data.name || "")
          .replace(/\b(PP|P|M|G|GG|XG|XGG|U)\b/gi, "")
          .replace(/^\s*[,;:\-/]+\s*|\s*[,;:\-/]+\s*$/g, "")
          .replace(/\s+/g, " ")
          .trim()
          .toLowerCase()
      ).filter(Boolean));
      if (existingColors.size === 1 && existingColors.has(requested)) {
        color = undefined;
      } else {
        return NextResponse.json(
          { error: "Este produto usa opcoes de cor do Square. Para evitar inconsistencia, a cor nao pode ser substituida por um campo livre." },
          { status: 409 }
        );
      }
    }

    const updatedItemData: Record<string, unknown> = {
      ...existingObject.item_data,
      name: name || existingObject.item_data?.name,
      description: description !== undefined ? description : existingObject.item_data?.description,
    };

    if (category) {
      const categoryId = await resolveSquareCategoryId(category, token);
      if (categoryId) {
        const launchCategoryId = isLaunch
          ? await resolveSquareCategoryId("Lançamentos", token)
          : undefined;
        const categoryIds = Array.from(
          new Set([categoryId, launchCategoryId].filter((id): id is string => Boolean(id)))
        );
        updatedItemData.category_id = categoryId;
        updatedItemData.categories = categoryIds.map((id) => ({ id }));
        updatedItemData.reporting_category = { id: categoryId };
      }
    }

    // Montar objeto atualizado
    const updatedObject: Record<string, unknown> = {
      type: "ITEM",
      id: productId,
      version: existingObject.version,
      item_data: updatedItemData,
    };

    // Se preço foi informado, atualizar todas as variações
    if (price || color !== undefined) {
      const priceInCents = Math.round((numericPrice ?? 0) * 100);
      const variations = existingVariations;
      const normalizedColor = typeof color === "string" ? color.trim().replace(/\s+/g, " ") : "";
      (updatedObject.item_data as Record<string, unknown>).variations = variations.map((v) => {
        const currentName = String(v.item_variation_data.name || "");
        const size = currentName.match(/\b(PP|P|M|G|GG|XG|XGG|U)\b/i)?.[1]?.toUpperCase() || currentName;
        return {
          type: "ITEM_VARIATION",
          id: v.id,
          version: v.version,
          item_variation_data: {
            ...v.item_variation_data,
            ...(color !== undefined ? { name: normalizedColor ? `${normalizedColor} ${size}` : size } : {}),
            ...(price ? {
              pricing_type: "FIXED_PRICING",
              price_money: { amount: priceInCents, currency: "USD" },
            } : {}),
          },
        };
      });
    }

    const idempotencyKey = `admin-update-${productId}-${Date.now()}`;
    const upsertResponse = await fetch(`${SQUARE_BASE_URL}/catalog/object`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Square-Version": SQUARE_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idempotency_key: idempotencyKey,
        object: updatedObject,
      }),
      cache: "no-store",
    });

    if (!upsertResponse.ok) {
      const err = await upsertResponse.json().catch(() => ({}));
      return NextResponse.json({ error: JSON.stringify(err) }, { status: 400 });
    }

    revalidateStorefront();
    return NextResponse.json({ ok: true, message: "Produto atualizado com sucesso." });
  } catch (err) {
    console.error("[admin/update-product]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
