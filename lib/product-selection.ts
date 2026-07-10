import type { Product } from "@/types";

const COLOR_WORDS = [
  "azul marinho",
  "off white",
  "off-white",
  "champagne",
  "champanhe",
  "caramelo",
  "marinho",
  "branca",
  "branco",
  "preta",
  "preto",
  "creme",
  "nude",
  "rose",
  "rosa",
  "bege",
  "vinho",
  "verde",
  "dourada",
  "dourado",
];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getStyleName(product: Product): string {
  let name = normalizeText(product.name);

  for (const color of COLOR_WORDS) {
    name = name.replace(new RegExp(`\\b${normalizeText(color)}\\b`, "g"), " ");
  }

  return name
    .replace(/\b(pp|p|m|g|gg|xg|xgg|u)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getColorKey(product: Product): string {
  const colors = product.colors?.map(normalizeText).filter(Boolean) ?? [];

  if (colors.length > 0) {
    return colors.sort().join("-");
  }

  const name = normalizeText(product.name);
  const found = COLOR_WORDS.filter((color) =>
    name.includes(normalizeText(color))
  ).map(normalizeText);

  return found.sort().join("-") || "sem-cor";
}

export function uniqueProductsByStyleAndColor(products: Product[]): Product[] {
  const seen = new Set<string>();

  return products.filter((product) => {
    const key = `${getStyleName(product)}::${getColorKey(product)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getCollectionProducts(products: Product[]): Product[] {
  return uniqueProductsByStyleAndColor(products);
}

export function getHighestTicketProducts(
  products: Product[],
  limit = 8
): Product[] {
  return uniqueProductsByStyleAndColor(products)
    .sort((a, b) => b.price - a.price)
    .slice(0, limit);
}
