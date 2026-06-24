import type { Product, ProductCategory } from "@/types";

const SQUARE_BASE_URL = "https://connect.squareup.com/v2";
const SQUARE_VERSION = "2024-01-18";

function getSquareToken(): string {
  const token = process.env.SQUARE_ACCESS_TOKEN;
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
  if (n.includes("casaquinho") || n.includes("casaqueto") || n.includes("blazer")) return "conjuntos";
  return "blusas";
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

  const products: Product[] = items.map((item, index) => {
    const idata = item.item_data!;
    const name = idata.name;
    const variations = idata.variations || [];

    // Obter URL da imagem principal
    const imageIds = idata.image_ids || [];
    let imageUrl = "/images/placeholder.jpg";
    if (imageIds.length > 0) {
      const imgObj = imageMap.get(imageIds[0]);
      if (imgObj?.image_data?.url) {
        imageUrl = imgObj.image_data.url;
      }
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

    // Verificar se tem estoque (por enquanto baseado no status do item)
    // O Square marca como sold out via inventory, mas aqui usamos inStock: true por padrão
    const inStock = true;

    return {
      id: item.id,
      name,
      slug: toSlug(name),
      price,
      rating: 4.9,
      reviewCount: 0,
      image: imageUrl,
      category: getCategory(name),
      description: idata.description || "",
      sizes: sizes.length > 0 ? sizes : undefined,
      colors: colors.length > 0 ? colors : undefined,
      inStock,
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
