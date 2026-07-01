"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { products } from "@/lib/data/products";
import type { CartItem, Product } from "@/types";

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  addItem: (product: Product, options: { size?: string; color?: string; quantity?: number }) => void;
  removeItem: (productId: string, size?: string, color?: string) => void;
  updateQuantity: (productId: string, size: string | undefined, color: string | undefined, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "virtuosa-cart";
const CART_VERSION = 1;
const CART_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface StoredCart {
  version: number;
  savedAt: number;
  items: CartItem[];
}

function sameItem(item: CartItem, productId: string, size?: string, color?: string) {
  return item.product.id === productId && item.size === size && item.color === color;
}

function sanitizeItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const item = candidate as Partial<CartItem>;
    const productId = item.product?.id;
    const product = products.find((entry) => entry.id === productId && entry.inStock);
    if (!product) return [];

    const quantity = Math.min(20, Math.max(1, Math.floor(Number(item.quantity) || 1)));
    const size = item.size && product.sizes?.includes(item.size) ? item.size : undefined;
    const color = item.color && product.colors?.includes(item.color) ? item.color : undefined;
    if (product.sizes?.length && !size) return [];
    if (product.colors?.length && !color) return [];
    return [{ product, quantity, size, color }];
  });
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as StoredCart | CartItem[];
        if (Array.isArray(parsed)) {
          setItems(sanitizeItems(parsed));
        } else if (parsed.version === CART_VERSION && Date.now() - parsed.savedAt <= CART_TTL_MS) {
          setItems(sanitizeItems(parsed.items));
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) {
      const storedCart: StoredCart = { version: CART_VERSION, savedAt: Date.now(), items };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storedCart));
    }
  }, [hydrated, items]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const addItem = useCallback((product: Product, options: { size?: string; color?: string; quantity?: number }) => {
    const quantity = options.quantity ?? 1;
    setItems((current) => {
      const exists = current.some((item) => sameItem(item, product.id, options.size, options.color));
      if (!exists) return [...current, { product, quantity, size: options.size, color: options.color }];
      return current.map((item) =>
        sameItem(item, product.id, options.size, options.color)
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((productId: string, size?: string, color?: string) => {
    setItems((current) => current.filter((item) => !sameItem(item, productId, size, color)));
  }, []);

  const updateQuantity = useCallback((productId: string, size: string | undefined, color: string | undefined, quantity: number) => {
    if (quantity <= 0) {
      setItems((current) => current.filter((item) => !sameItem(item, productId, size, color)));
      return;
    }
    setItems((current) => current.map((item) =>
      sameItem(item, productId, size, color) ? { ...item, quantity } : item
    ));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(() => ({
    items,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    isOpen,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
  }), [addItem, clearCart, closeCart, isOpen, items, openCart, removeItem, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
