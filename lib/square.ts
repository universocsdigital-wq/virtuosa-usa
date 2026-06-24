import type { Product, ProductCategory } from "@/types";

const SQUARE_BASE_URL = "https://connect.squareup.com/v2";
const SQUARE_VERSION = "2024-01-18";

function getSquareToken(): string {
  // Suporta tanto SQUARE_ACCESS_TOKEN quanto o nome em português configurado na Vercel
  const token =
    process.env.SQUARE_ACCESS_TOKEN ||
    process.env["LOCALIZAÇÃO_QUADRADA_"] ||
    process.env.LOCALIZACAO_QUADRADA_;
  if (!token) throw new Error("SQUARE_ACCESS_TOKEN não configurado");
  return token;
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function getCategory(name: string): ProductCategory {
  const n = name.toLowerCase();
  if (n.includes("vestido")) return "vestidos";
  if (n.includes("saia")) return "saias";
  if (n.includes("calça") || n.includes("calca")) return "calcas";
  if (n.includes("conjunto")) return "conjuntos";
  if (
    n.includes("casaquinho") ||
    n.includes("casaqueto") ||
    n.includes("blazer") ||
    n.includes("cardigan") ||
    n.includes("colete")
  ) return "conjuntos";
  return "blusas";
}

interface SquareInventoryCount {
  catalog_object_id: string;
  catalog_object_type: string;
  state: string;
  quantity: string;
}

/**
 * Busca contagens de estoque do Square para uma lista de IDs de variações.
 * Retorna um Map de variationId → quantidade total em estoque.
 */
async function getInventoryCounts(
  token: string,
  variationIds: string[]
): Promise<Map<string, number>> {
  const inventoryMap = new Map<string, number>();
  if (variationIds.length === 0) return inventoryMap;

  try {
    const response = await fetch(
      `${SQUARE_BASE_URL}/inventory/counts/batch-retrieve`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Square-Version": SQUARE_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          catalog_object_ids: variationIds,
          states: ["IN_STOCK"],
        }),
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      console.error(`Square Inventory API error: ${response.status}`);
      // Em caso de erro, assume que todos os produtos estão em estoque
      for (const id of variationIds) {
        inventoryMap.set(id, 1);
      }
      return inventoryMap;
    }

    const data = await response.json();
    const counts: SquareInventoryCount[] = data.counts || [];

    for (const count of counts) {
      if (count.state === "IN_STOCK") {
        const qty = parseFloat(count.quantity) || 0;
        const existing = inventoryMap.get(count.catalog_object_id) || 0;
        inventoryMap.set(count.catalog_object_id, existing + qty);
      }
    }
  } catch (err) {
    console.error("Erro ao buscar estoque do Square:", err);
    // Em caso de erro, assume que todos os produtos estão em estoque
    for (const id of variationIds) {
      inventoryMap.set(id, 1);
    }
  }

  return inventoryMap;
}

interface SquareCatalogObject {
  id: string;
  type: string;
  item_data?: {
    name: string;
    description?: string;
    image_ids?: string[];
    variations?: SquareCatalogObject[];
  };
  item_variation_data?: {
    name: string;
    sku?: string;
    price_money?: { amount: number; currency: string };
  };
  image_data?: {
    url: string;
    name?: string;
  };
}

export async function getSquareProducts(): Promise<Product[]> {
  const token = getSquareToken();

  const response = await fetch(`${SQUARE_BASE_URL}/catalog/list?types=ITEM,IMAGE`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Square-Version": SQUARE_VERSION,
      "Content-Type": "application/json",
    },
    next: { revalidate: 300 }, // cache por 5 minutos
  });

  if (!response.ok) {
    throw new Error(`Square API error: ${response.status}`);
  }

  const data = await response.json();
  const objects: SquareCatalogObject[] = data.objects || [];

  const items = objects.filter((o) => o.type === "ITEM");
  const imageMap = new Map(
    objects.filter((o) => o.type === "IMAGE").map((o) => [o.id, o])
  );

  // Coletar todos os IDs de variações para consultar estoque em lote
  const allVariationIds: string[] = [];
  for (const item of items) {
    const variations = item.item_data?.variations || [];
    for (const v of variations) {
      allVariationIds.push(v.id);
    }
  }

  // Buscar estoque de todas as variações de uma vez
  const inventoryMap = await getInventoryCounts(token, allVariationIds);

  const products: Product[] = items.map((item) => {
    const idata = item.item_data!;
    const name = idata.name;
    const variations = idata.variations || [];

    // Obter URLs de todas as imagens do produto
    const imageIds = idata.image_ids || [];
    let imageUrl = "/images/placeholder.jpg";
    const allImages: string[] = [];

    for (const imgId of imageIds) {
      const imgObj = imageMap.get(imgId);
      if (imgObj?.image_data?.url) {
        allImages.push(imgObj.image_data.url);
      }
    }

    if (allImages.length > 0) {
      imageUrl = allImages[0];
    }

    // Extrair tamanhos únicos das variações
    const sizes = Array.from(
      new Set(
        variations
          .map((v) => {
            const vname = v.item_variation_data?.name || "";
            // Extrair tamanho do nome da variação (ex: "Branca P" → "P", "Caramelo M" → "M")
            const sizeMatch = vname.match(/\b(PP|P|M|G|GG|XG|XGG|U)\b/i);
            return sizeMatch ? sizeMatch[1].toUpperCase() : null;
          })
          .filter(Boolean) as string[]
      )
    );

    // Extrair cores únicas das variações
    const colors = Array.from(
      new Set(
        variations
          .map((v) => {
            const vname = v.item_variation_data?.name || "";
            // Remover o tamanho para obter a cor
            const color = vname.replace(/\b(PP|P|M|G|GG|XG|XGG|U)\b/gi, "").trim();
            return color || null;
          })
          .filter(Boolean) as string[]
      )
    );

    // Preço da primeira variação
    const firstVariation = variations[0];
    const priceAmount = firstVariation?.item_variation_data?.price_money?.amount || 0;
    const price = priceAmount / 100;

    return {
      id: item.id,
      name,
      slug: toSlug(name),
      price,
      rating: 4.9,
      reviewCount: 0,
      image: imageUrl,
      images: allImages.length > 1 ? allImages : undefined,
      category: getCategory(name),
      description: idata.description || "",
      sizes: sizes.length > 0 ? sizes : undefined,
      colors: colors.length > 0 ? colors : undefined,
      // Produto está em estoque se QUALQUER variação tiver quantidade > 0
      inStock: variations.some((v) => (inventoryMap.get(v.id) || 0) > 0),
    } satisfies Product;
  });

  // Ordenar: vestidos primeiro, depois saias, conjuntos, blusas
  const categoryOrder: ProductCategory[] = ["vestidos", "saias", "conjuntos", "blusas", "calcas"];
  return products.sort(
    (a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category)
  );
}

export async function getSquareProductBySlug(slug: string): Promise<Product | null> {
  const products = await getSquareProducts();
  return products.find((p) => p.slug === slug) ?? null;
}
