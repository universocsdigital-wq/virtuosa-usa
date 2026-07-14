import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getSquareVariationId, decrementSquareInventory } from "@/lib/square";
import { revalidateStorefront } from "@/lib/store-cache";

export async function POST(request: Request) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  try {
    const { productId, size, quantity, paymentMethod } = await request.json();

    if (!productId || !quantity || quantity < 1) {
      return NextResponse.json({ error: "Produto e quantidade sao obrigatorios." }, { status: 400 });
    }

    const locationId =
      process.env.SQUARE_LOCATION_ID ||
      process.env["IO_DA_LOCALIZAÇÃO_QUADRADA"] ||
      process.env.IO_DA_LOCALIZACAO_QUADRADA;

    if (!locationId) {
      return NextResponse.json({ error: "SQUARE_LOCATION_ID nao configurado." }, { status: 500 });
    }

    // Buscar o ID da variacao no Square
    const variationId = await getSquareVariationId(productId, size || "U");
    if (!variationId) {
      return NextResponse.json(
        { error: `Variacao '${size || "unica"}' nao encontrada para este produto.` },
        { status: 404 }
      );
    }

    // Decrementar o estoque no Square
    const result = await decrementSquareInventory(variationId, quantity, locationId);
    if (!result.ok) {
      console.error("[admin/register-sale] Erro ao decrementar estoque:", result.error);
      return NextResponse.json(
        { error: `Erro ao atualizar estoque: ${result.error}` },
        { status: 500 }
      );
    }

    console.log(`[admin] Venda registrada: produto=${productId} tamanho=${size} qtd=${quantity} pagamento=${paymentMethod}`);

    revalidateStorefront();
    return NextResponse.json({
      ok: true,
      message: `Venda registrada. Estoque atualizado no Square.`,
    });
  } catch (err) {
    console.error("[admin/register-sale]", err);
    return NextResponse.json({ error: "Erro interno ao registrar venda." }, { status: 500 });
  }
}
