import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { revalidateStorefront } from "@/lib/store-cache";

const SQUARE_BASE_URL = "https://connect.squareup.com/v2";
const SQUARE_VERSION = "2024-01-18";
const MAX_IMAGE_SIZE = 15 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/pjpeg", "image/png", "image/gif"]);

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
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    const productId = formData.get("productId") as string | null;
    const isPrimary = formData.get("isPrimary") !== "false";

    if (!file || !productId) {
      return NextResponse.json({ error: "image e productId sao obrigatorios." }, { status: 400 });
    }
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Formato nao aceito pelo Square. Use JPG, PNG ou GIF." }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "A foto deve ter no maximo 15 MB." }, { status: 400 });
    }

    const idempotencyKey = `admin-img-${productId}-${Date.now()}`;
    const imageBuffer = Buffer.from(await file.arrayBuffer());

    // Montar multipart/form-data para o Square
    const boundary = `----FormBoundary${Date.now()}`;
    const requestJson = JSON.stringify({
      idempotency_key: idempotencyKey,
      object_id: productId,
      is_primary: isPrimary,
      image: {
        type: "IMAGE",
        id: "#new-image",
        image_data: {
          caption: "",
        },
      },
    });

    const bodyParts: Buffer[] = [];
    bodyParts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="request"\r\nContent-Type: application/json\r\n\r\n${requestJson}\r\n`
      )
    );
    bodyParts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="image_file"; filename="${file.name}"\r\nContent-Type: ${file.type || "image/jpeg"}\r\n\r\n`
      )
    );
    bodyParts.push(imageBuffer);
    bodyParts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const multipartBody = Buffer.concat(bodyParts);

    const response = await fetch(`${SQUARE_BASE_URL}/catalog/images`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Square-Version": SQUARE_VERSION,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body: multipartBody,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json({ error: JSON.stringify(err) }, { status: 400 });
    }

    const data = await response.json();
    const imageUrl = data.image?.image_data?.url || null;
    revalidateStorefront();

    return NextResponse.json({ ok: true, imageUrl, imageId: data.image?.id || null });
  } catch (err) {
    console.error("[admin/upload-image]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
