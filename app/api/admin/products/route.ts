import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getSquareProducts } from "@/lib/square";

export async function GET() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  try {
    const products = await getSquareProducts();
    // Retorna apenas os campos necessarios para o painel
    const simplified = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      image: p.image,
      category: p.category,
      sizes: p.sizes ?? [],
      colors: p.colors ?? [],
      inventoryBySize: p.inventoryBySize ?? {},
      inventoryByColorSize: p.inventoryByColorSize ?? {},
      inStock: p.inStock,
      sourceProductId: p.sourceProductId,
    }));
    return NextResponse.json({ products: simplified });
  } catch (err) {
    console.error("[admin/products]", err);
    return NextResponse.json({ error: "Erro ao carregar produtos." }, { status: 500 });
  }
}
