import type { Product, ProductCategory } from "@/types";
import { products as staticProducts } from "@/lib/data/products";

const SQUARE_BASE_URL = "https://connect.squareup.com/v2";
const SQUARE_VERSION = "2024-01-18";

function getSquareToken(): string | null {
  // Suporta tanto SQUARE_ACCESS_TOKEN quanto o nome em português configurado na Vercel
  const token =
    process.env.SQUARE_ACCESS_TOKEN ||
    process.env["LOCALIZAÇÃO_QUADRADA_"] ||
    process.env.LOCALIZACAO_QUADRADA_;
  return token || null;
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

function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function cleanVariationLabel(value: string): string {
  return value
    .replace(/\s*[-–—/|]\s*$/g, "")
    .replace(/^\s*[-–—/|]\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function colorToSlug(color: string): string {
  return toSlug(color || "cor");
}

function applyProductOverrides(product: Product): Product {
  const normalizedName = normalizeProductName(product.name);

  if (normalizedName.includes("richelieu")) {
    return {
      ...product,
      name: "Vestido Richelieu Off White",
      slug: "vestido-richelieu-off-white",
      price: 300,
      category: "vestidos",
      sizes: ["P", "M", "G"],
      colors: ["Off White"],
      inventoryBySize: { P: 2, M: 1, G: 1 },
      inStock: true,
    };
  }

  if (normalizeProductName(product.name).includes("elisama")) {
    return {
      ...product,
      name: "Conjunto Elisama",
      slug: "conjunto-elisama",
      category: "conjuntos",
    };
  }

  if (
    normalizedName.includes("doce maria") &&
    (normalizedName.includes("midi elegante") || normalizedName.includes("lese"))
  ) {
    return {
      ...product,
      price: 145,
      sizes: ["PP", "P", "M", "G", "GG"],
      colors: ["Azul"],
      inventoryBySize: { PP: 2, P: 2, M: 1, GG: 1 },
    };
  }

  if (normalizedName.includes("lese") && normalizedName.includes("algodao")) {
    return {
      ...product,
      name: "Vestido em Lese 100% Algodão",
      slug: "vestido-em-lese-100-algodao",
      price: 140,
      category: "vestidos",
      sizes: ["P", "M", "GG"],
      colors: ["Nude"],
      inventoryBySize: { P: 3, M: 2, GG: 1 },
      inventoryByColorSize: {
        Nude: { P: 3, M: 2, GG: 1 },
      },
      inStock: true,
    };
  }

  if (normalizedName.includes("verde") && normalizedName.includes("algodao") && normalizedName.includes("bordado")) {
    return {
      ...product,
      name: "Vestido Midi Verde em Algodão Bordado",
      slug: "vestido-midi-verde-em-algodao-bordado",
      price: 145,
      category: "vestidos",
      sizes: ["P", "M", "G", "GG"],
      colors: ["Verde", "Verde Lima"],
      inventoryBySize: { P: 6, M: 3, G: 1, GG: 1 },
      inventoryByColorSize: {
        Verde: { P: 3, M: 1 },
        "Verde Lima": { P: 3, M: 2, G: 1, GG: 1 },
      },
      inStock: true,
    };
  }

  return product;
}

function createManualProducts(existingProducts: Product[]): Product[] {
  const existingSlugs = new Set(existingProducts.map((product) => product.slug));
  const manualProducts: Product[] = [];

  if (!existingSlugs.has("conjunto-soney-verde")) {
    manualProducts.push({
      id: "manual-conjunto-soney-verde",
      name: "Conjunto Soney Verde",
      slug: "conjunto-soney-verde",
      price: 320,
      rating: 4.9,
      reviewCount: 0,
      image: "/images/placeholder.jpg",
      images: ["/images/placeholder.jpg"],
      category: "conjuntos",
      description: "Conjunto Soney em verde.",
      badge: "new",
      sizes: ["M"],
      colors: ["Verde"],
      inventoryBySize: { M: 1 },
      inventoryByColorSize: { Verde: { M: 1 } },
      inStock: true,
    });
  }

  if (!existingSlugs.has("t-shirt-aplicacao-de-flores-branca")) {
    manualProducts.push({
      id: "manual-t-shirt-aplicacao-de-flores-branca",
      name: "T-shirt Aplicação de Flores Branca",
      slug: "t-shirt-aplicacao-de-flores-branca",
      price: 49,
      rating: 4.9,
      reviewCount: 0,
      image: "/images/placeholder.jpg",
      images: ["/images/placeholder.jpg"],
      category: "blusas",
      description: "T-shirt branca com aplicacao de flores.",
      badge: "new",
      sizes: ["P", "M", "G"],
      colors: ["Branca"],
      inventoryBySize: { P: 1, M: 1, G: 1 },
      inventoryByColorSize: { Branca: { P: 1, M: 1, G: 1 } },
      inStock: true,
    });
  }

  return manualProducts;
}

function expandProductColorCards(products: Product[]): Product[] {
  return products.flatMap((product) => {
    const colors = product.colors ?? [];
    if (colors.length <= 1) return [product];

    return colors.map((color, index) => {
      const colorImages = product.imagesByColor?.[color] ?? [];
      const fallbackImage = product.images?.[index] ?? product.image;
      const images =
        colorImages.length > 0
          ? colorImages
          : fallbackImage
          ? [fallbackImage, ...(product.images ?? []).filter((image) => image !== fallbackImage)]
          : product.images;
      const inventoryBySize = product.inventoryByColorSize?.[color] ?? product.inventoryBySize;
      const colorSlug = colorToSlug(color);

      return {
        ...product,
        id: `${product.id}::${colorSlug}`,
        sourceProductId: product.sourceProductId ?? product.id,
        slug: `${product.slug}-${colorSlug}`,
        name: `${product.name} ${color}`,
        image: images?.[0] ?? fallbackImage,
        images,
        colors: [color],
        inventoryBySize,
        inventoryByColorSize: product.inventoryByColorSize?.[color]
          ? { [color]: product.inventoryByColorSize[color] }
          : product.inventoryByColorSize,
        inStock: inventoryBySize ? Object.values(inventoryBySize).some((qty) => qty > 0) : product.inStock,
      } satisfies Product;
    });
  });
}

function getCategory(name: string): ProductCategory {
  const n = name.toLowerCase();
  if (n.includes("vestido")) return "vestidos";
  if (n.includes("saia")) return "saias";
  if (n.includes("calça") || n.includes("calca")) return "calcas";
  if (n.includes("conjunto")) return "conjuntos";
  if (
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
    image_ids?: string[];
  };
  image_data?: {
    url: string;
    name?: string;
  };
}

async function fetchSquareCatalogObjects(token: string): Promise<SquareCatalogObject[]> {
  const objects: SquareCatalogObject[] = [];
  let cursor: string | undefined;

  do {
    const params = new URLSearchParams({ types: "ITEM,IMAGE" });
    if (cursor) params.set("cursor", cursor);

    const response = await fetch(`${SQUARE_BASE_URL}/catalog/list?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Square-Version": SQUARE_VERSION,
        "Content-Type": "application/json",
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`Square API error: ${response.status}`);
    }

    const data = await response.json();
    objects.push(...((data.objects || []) as SquareCatalogObject[]));
    cursor = data.cursor;
  } while (cursor);

  return objects;
}

function addUnique(target: string[], values: string[]) {
  for (const value of values) {
    if (value && !target.includes(value)) {
      target.push(value);
    }
  }
}

function getImageUrlsFromIds(
  imageIds: string[],
  imageMap: Map<string, SquareCatalogObject>
): string[] {
  const urls: string[] = [];

  for (const imageId of imageIds) {
    const imageObject = imageMap.get(imageId);
    const imageUrl = imageObject?.image_data?.url;
    if (imageUrl && !urls.includes(imageUrl)) {
      urls.push(imageUrl);
    }
  }

  return urls;
}

export async function getSquareProducts(): Promise<Product[]> {
  const token = getSquareToken();
  if (!token) return staticProducts;

  const objects = await fetchSquareCatalogObjects(token);

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

    // Obter URLs de todas as imagens do produto e das variacoes.
    const imageIds: string[] = [];
    addUnique(imageIds, idata.image_ids || []);
    for (const variation of variations) {
      addUnique(imageIds, variation.item_variation_data?.image_ids || []);
    }

    const allImages: string[] = [];
    addUnique(allImages, getImageUrlsFromIds(imageIds, imageMap));

    const imageUrl = allImages[0] || "/images/placeholder.jpg";

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
            const color = cleanVariationLabel(
              vname.replace(/\b(PP|P|M|G|GG|XG|XGG|U)\b/gi, "")
            );
            return color || null;
          })
          .filter(Boolean) as string[]
      )
    );

    // Preço da primeira variação
    const inventoryBySize = variations.reduce<Record<string, number>>((acc, variation) => {
      const vname = variation.item_variation_data?.name || "";
      const sizeMatch = vname.match(/\b(PP|P|M|G|GG|XG|XGG|U)\b/i);
      if (!sizeMatch) return acc;
      const size = sizeMatch[1].toUpperCase();
      acc[size] = (acc[size] || 0) + (inventoryMap.get(variation.id) || 0);
      return acc;
    }, {});

    const inventoryByColorSize = variations.reduce<Record<string, Record<string, number>>>((acc, variation) => {
      const vname = variation.item_variation_data?.name || "";
      const sizeMatch = vname.match(/\b(PP|P|M|G|GG|XG|XGG|U)\b/i);
      if (!sizeMatch) return acc;

      const size = sizeMatch[1].toUpperCase();
      const color = cleanVariationLabel(
        vname.replace(/\b(PP|P|M|G|GG|XG|XGG|U)\b/gi, "")
      );

      if (!color) return acc;

      acc[color] ??= {};
      acc[color][size] = (acc[color][size] || 0) + (inventoryMap.get(variation.id) || 0);
      return acc;
    }, {});

    const imagesByColor = variations.reduce<Record<string, string[]>>((acc, variation) => {
      const vname = variation.item_variation_data?.name || "";
      const color = cleanVariationLabel(
        vname.replace(/\b(PP|P|M|G|GG|XG|XGG|U)\b/gi, "")
      );

      if (!color) return acc;

      const variationImages = getImageUrlsFromIds(
        variation.item_variation_data?.image_ids || [],
        imageMap
      );

      if (variationImages.length > 0) {
        acc[color] ??= [];
        addUnique(acc[color], variationImages);
      }

      return acc;
    }, {});

    const firstVariation = variations[0];
    const priceAmount = firstVariation?.item_variation_data?.price_money?.amount || 0;
    const price = priceAmount / 100;

    return applyProductOverrides({
      id: item.id,
      name,
      slug: toSlug(name),
      price,
      rating: 4.9,
      reviewCount: 0,
      image: imageUrl,
      images: allImages.length > 0 ? allImages : undefined,
      category: getCategory(name),
      description: idata.description || "",
      sizes: sizes.length > 0 ? sizes : undefined,
      colors: colors.length > 0 ? colors : undefined,
      inventoryBySize: Object.keys(inventoryBySize).length > 0 ? inventoryBySize : undefined,
      inventoryByColorSize: Object.keys(inventoryByColorSize).length > 0 ? inventoryByColorSize : undefined,
      imagesByColor: Object.keys(imagesByColor).length > 0 ? imagesByColor : undefined,
      // Produto está em estoque se QUALQUER variação tiver quantidade > 0
      inStock: variations.some((v) => (inventoryMap.get(v.id) || 0) > 0),
    } satisfies Product);
  });

  products.push(...createManualProducts(products));
  const displayProducts = expandProductColorCards(products);

  // Ordenar: vestidos primeiro, depois saias, conjuntos, blusas
  const categoryOrder: ProductCategory[] = ["vestidos", "saias", "conjuntos", "blusas", "calcas"];
  return displayProducts.sort(
    (a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category)
  );
}

export async function getSquareProductBySlug(slug: string): Promise<Product | null> {
  const products = await getSquareProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

/**
 * Busca o ID de variacao do Square para um produto e tamanho especificos.
 * Usado pelo painel admin para registrar vendas manuais e baixar estoque.
 */
export async function getSquareVariationId(
  productId: string,
  size: string
): Promise<string | null> {
  const token = getSquareToken();
  if (!token) return null;

  try {
    const response = await fetch(`${SQUARE_BASE_URL}/catalog/object/${productId}?include_related_objects=true`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Square-Version": SQUARE_VERSION,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = await response.json();
    const variations: SquareCatalogObject[] = data.object?.item_data?.variations || [];
    const sizeUpper = size.toUpperCase();
    for (const v of variations) {
      const vname = (v.item_variation_data?.name || "").toUpperCase();
      if (vname.includes(sizeUpper)) {
        return v.id;
      }
    }
    if (variations.length === 1) return variations[0].id;
    return null;
  } catch {
    return null;
  }
}

/**
 * Ajusta o estoque de uma variacao no Square (decrementa pela quantidade vendida).
 * Usado para registrar vendas por Zelle, dinheiro ou outros meios externos.
 */
export async function decrementSquareInventory(
  variationId: string,
  quantity: number,
  locationId: string
): Promise<{ ok: boolean; error?: string }> {
  const token = getSquareToken();
  if (!token) return { ok: false, error: "Token do Square nao configurado." };

  try {
    const idempotencyKey = `admin-sale-${variationId}-${Date.now()}`;
    const response = await fetch(`${SQUARE_BASE_URL}/inventory/changes/batch-create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Square-Version": SQUARE_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idempotency_key: idempotencyKey,
        changes: [
          {
            type: "ADJUSTMENT",
            adjustment: {
              catalog_object_id: variationId,
              location_id: locationId,
              from_state: "IN_STOCK",
              to_state: "SOLD",
              quantity: String(quantity),
              occurred_at: new Date().toISOString(),
            },
          },
        ],
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { ok: false, error: JSON.stringify(err) };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
