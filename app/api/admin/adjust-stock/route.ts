import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getSquareVariationId } from "@/lib/square";

const SQUARE_BASE_URL = "https://connect.squareup.com/v2";
const SQUARE_VERSION = "2024-01-18";

function getSquareToken(): string | null {
  return process.env.SQUARE_ACCESS_TOKEN || null;
}

function getLocationId(): string | null {
  return process.env.SQUARE_LOCATION_ID || process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || null;
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
    // adjustments: Array<{ variationId: string; quantity: number; action: "add" | "set" }>
    // action "add" = adiciona ao estoque atual, "set" = define quantidade absoluta
    const { productId, size, quantity, action } = body;

    if (!productId || !size || quantity === undefined) {
      return NextResponse.json(
        { error: "productId, size e quantity sao obrigatorios." },
        { status: 400 }
      );
    }
    const numericQuantity = Number(quantity);
    const minimumQuantity = action === "set" ? 0 : 1;
    if (!Number.isInteger(numericQuantity) || numericQuantity < minimumQuantity) {
      return NextResponse.json(
        { error: action === "set" ? "A quantidade deve ser um numero inteiro igual ou maior que zero." : "A quantidade deve ser um numero inteiro maior que zero." },
        { status: 400 }
      );
    }

    const variationId = await getSquareVariationId(productId, size);
    if (!variationId) {
      return NextResponse.json(
        { error: `Variacao "${size}" nao encontrada para este produto.` },
        { status: 404 }
      );
    }

    const idempotencyKey = `admin-adjust-${variationId}-${Date.now()}`;

    let change: Record<string, unknown>;

    if (action === "set") {
      // Contagem física absoluta
      change = {
        type: "PHYSICAL_COUNT",
        physical_count: {
          catalog_object_id: variationId,
          location_id: locationId,
          state: "IN_STOCK",
          quantity: String(numericQuantity),
          occurred_at: new Date().toISOString(),
        },
      };
    } else {
      // Adicionar ao estoque (RECEIVE = entrada de mercadoria)
      change = {
        type: "ADJUSTMENT",
        adjustment: {
          catalog_object_id: variationId,
          location_id: locationId,
          from_state: "NONE",
          to_state: "IN_STOCK",
          quantity: String(numericQuantity),
          occurred_at: new Date().toISOString(),
        },
      };
    }

    const response = await fetch(`${SQUARE_BASE_URL}/inventory/changes/batch-create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Square-Version": SQUARE_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idempotency_key: idempotencyKey,
        changes: [change],
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json({ error: JSON.stringify(err) }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: action === "set"
        ? `Estoque definido para ${quantity} unidade(s) no tamanho ${size}.`
        : `${quantity} unidade(s) adicionada(s) ao estoque no tamanho ${size}.`,
    });
  } catch (err) {
    console.error("[admin/adjust-stock]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
