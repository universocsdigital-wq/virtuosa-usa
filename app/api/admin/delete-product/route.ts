import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { revalidateStorefront } from "@/lib/store-cache";

const SQUARE_BASE_URL = "https://connect.squareup.com/v2";
const SQUARE_VERSION = "2024-01-18";

export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Token do Square nao configurado." }, { status: 500 });
  }

  try {
    const { productId } = await req.json();
    if (!productId || typeof productId !== "string") {
      return NextResponse.json({ error: "Produto invalido." }, { status: 400 });
    }

    const response = await fetch(`${SQUARE_BASE_URL}/catalog/object/${encodeURIComponent(productId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}`, "Square-Version": SQUARE_VERSION, "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json({ error: JSON.stringify(error) }, { status: response.status });
    }

    revalidateStorefront();
    return NextResponse.json({ ok: true, message: "Produto excluido do Square e da loja." });
  } catch (error) {
    console.error("[admin/delete-product]", error);
    return NextResponse.json({ error: "Nao foi possivel excluir o produto." }, { status: 500 });
  }
}
