"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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

function sameItem(item: CartItem, productId: string, size?: string, color?: string) {
  return item.product.id === productId && item.size === size && item.color === color;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved) as CartItem[]);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
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
