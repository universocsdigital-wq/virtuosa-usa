export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  images?: string[];
  category: ProductCategory;
  badge?: "best-seller" | "new" | "sale";
  description?: string;
  sizes?: string[];
  colors?: string[];
  inStock: boolean;
  checkoutUrl?: string;
}

export type ProductCategory = "vestidos" | "saias" | "conjuntos" | "blusas" | "calcas";

export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  verified: boolean;
  date?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  href: string;
}

export interface TrustItem {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface InstagramPost {
  id: string;
  image: string;
  alt: string;
  href?: string;
}

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
}
