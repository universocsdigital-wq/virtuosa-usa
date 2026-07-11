import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";

const SQUARE_BASE_URL = "https://connect.squareup.com/v2";
const SQUARE_VERSION = "2024-01-18";

function getSquareToken(): string | null {
  return process.env.SQUARE_ACCESS_TOKEN || null;
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
    const { productId, name, description, price } = body;

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

    // Montar objeto atualizado
    const updatedObject: Record<string, unknown> = {
      type: "ITEM",
      id: productId,
      version: existingObject.version,
      item_data: {
        ...existingObject.item_data,
        name: name || existingObject.item_data?.name,
        description: description !== undefined ? description : existingObject.item_data?.description,
      },
    };

    // Se preço foi informado, atualizar todas as variações
    if (price) {
      const priceInCents = Math.round(parseFloat(price) * 100);
      const variations = (existingObject.item_data?.variations || []) as Array<{
        id: string;
        version: number;
        item_variation_data: Record<string, unknown>;
      }>;
      (updatedObject.item_data as Record<string, unknown>).variations = variations.map((v) => ({
        type: "ITEM_VARIATION",
        id: v.id,
        version: v.version,
        item_variation_data: {
          ...v.item_variation_data,
          pricing_type: "FIXED_PRICING",
          price_money: {
            amount: priceInCents,
            currency: "USD",
          },
        },
      }));
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

    return NextResponse.json({ ok: true, message: "Produto atualizado com sucesso." });
  } catch (err) {
    console.error("[admin/update-product]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
