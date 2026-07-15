import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";

const SQUARE_BASE_URL = "https://connect.squareup.com/v2";
const SQUARE_VERSION = "2024-01-18";

interface CatalogObject {
  type?: string;
  tax_data?: {
    name?: string;
    percentage?: string;
    enabled?: boolean;
    applies_to_custom_amounts?: boolean;
  };
  item_data?: { tax_ids?: string[] };
}

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Token do Square nao configurado." }, { status: 500 });
  }

  try {
    const objects: CatalogObject[] = [];
    let cursor = "";
    do {
      const params = new URLSearchParams({ types: "TAX,ITEM" });
      if (cursor) params.set("cursor", cursor);
      const response = await fetch(`${SQUARE_BASE_URL}/catalog/list?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Square-Version": SQUARE_VERSION,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });
      if (!response.ok) {
        return NextResponse.json({ error: "Nao foi possivel consultar os impostos do Square." }, { status: 502 });
      }
      const data = await response.json();
      objects.push(...(data.objects ?? []));
      cursor = data.cursor ?? "";
    } while (cursor);

    const taxes = objects
      .filter((object) => object.type === "TAX")
      .map((object) => ({
        name: object.tax_data?.name ?? "Tax",
        percentage: object.tax_data?.percentage ?? "0",
        enabled: object.tax_data?.enabled !== false,
        appliesToCustomAmounts: object.tax_data?.applies_to_custom_amounts === true,
      }));
    const items = objects.filter((object) => object.type === "ITEM");
    const taxableItems = items.filter((item) => (item.item_data?.tax_ids?.length ?? 0) > 0).length;

    return NextResponse.json({ taxes, totalItems: items.length, taxableItems });
  } catch {
    return NextResponse.json({ error: "Nao foi possivel consultar os impostos do Square." }, { status: 500 });
  }
}
