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
    const { productId, imageUrl } = (await req.json()) as { productId?: string; imageUrl?: string };
    if (!productId || !imageUrl) {
      return NextResponse.json({ error: "Produto e foto sao obrigatorios." }, { status: 400 });
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Square-Version": SQUARE_VERSION,
      "Content-Type": "application/json",
    };
    const itemResponse = await fetch(`${SQUARE_BASE_URL}/catalog/object/${encodeURIComponent(productId)}`, {
      headers,
      cache: "no-store",
    });
    if (!itemResponse.ok) {
      return NextResponse.json({ error: "Produto nao encontrado no Square." }, { status: 404 });
    }

    const itemData = await itemResponse.json();
    const item = itemData.object as {
      id: string;
      type: "ITEM";
      version: number;
      item_data?: Record<string, unknown> & { image_ids?: string[] };
    };
    const imageIds = item.item_data?.image_ids ?? [];
    if (imageIds.length === 0) {
      return NextResponse.json({ error: "Este produto nao possui fotos no Square." }, { status: 400 });
    }

    const imagesResponse = await fetch(`${SQUARE_BASE_URL}/catalog/batch-retrieve`, {
      method: "POST",
      headers,
      body: JSON.stringify({ object_ids: imageIds, include_related_objects: false }),
      cache: "no-store",
    });
    if (!imagesResponse.ok) {
      return NextResponse.json({ error: "Nao foi possivel localizar a foto no Square." }, { status: 502 });
    }

    const imagesData = await imagesResponse.json();
    const targetImage = (imagesData.objects ?? []).find(
      (image: { id?: string; image_data?: { url?: string } }) => image.image_data?.url === imageUrl,
    ) as { id?: string } | undefined;
    if (!targetImage?.id) {
      return NextResponse.json({ error: "A foto selecionada nao foi encontrada no Square." }, { status: 404 });
    }

    const remainingImageIds = imageIds.filter((id) => id !== targetImage.id);
    const updateResponse = await fetch(`${SQUARE_BASE_URL}/catalog/object`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        idempotency_key: `admin-delete-image-${productId}-${targetImage.id}-${Date.now()}`,
        object: {
          type: "ITEM",
          id: item.id,
          version: item.version,
          item_data: { ...item.item_data, image_ids: remainingImageIds },
        },
      }),
      cache: "no-store",
    });
    if (!updateResponse.ok) {
      const detail = await updateResponse.json().catch(() => ({}));
      return NextResponse.json({ error: JSON.stringify(detail) }, { status: 400 });
    }

    revalidateStorefront();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/delete-image]", error);
    return NextResponse.json({ error: "Nao foi possivel excluir a foto." }, { status: 500 });
  }
}
