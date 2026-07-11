"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import type { Product } from "@/types";

function getAvailableQuantity(product: Product, size?: string, color?: string) {
  if (!size) return undefined;
  if (color && product.inventoryByColorSize?.[color]) return product.inventoryByColorSize[color][size] ?? 0;
  return product.inventoryBySize?.[size];
}

export function ProductPurchasePanel({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [size, setSize] = useState(product.sizes?.length === 1 ? product.sizes[0] : "");
  const [color, setColor] = useState(product.colors?.length === 1 ? product.colors[0] : "");
  const [error, setError] = useState("");

  const selectedSizeQuantity = getAvailableQuantity(product, size, color);
  const selectedSizeUnavailable = Boolean(
    size &&
      (product.inventoryByColorSize?.[color] || product.inventoryBySize) &&
      (selectedSizeQuantity ?? 0) <= 0
  );

  function addToCart() {
    if (!product.inStock) return;
    if (product.sizes?.length && !size) {
      setError("Selecione um tamanho para continuar.");
      return;
    }
    if (product.colors?.length && !color) {
      setError("Selecione uma cor para continuar.");
      return;
    }
    if (selectedSizeUnavailable) {
      setError("Essa combinação está sem estoque.");
      return;
    }
    setError("");
    addItem(product, { size: size || undefined, color: color || undefined });
  }

  return (
    <div className="mt-7">
      {product.sizes?.length ? (
        <fieldset>
          <legend className="mb-3 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A5A36]">Escolha o tamanho</legend>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((option) => {
              const requiresColor = Boolean(product.inventoryByColorSize && product.colors?.length && !color);
              const quantity = getAvailableQuantity(product, option, color);
              const unavailable = !requiresColor && quantity !== undefined && quantity <= 0;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSize(option)}
                  disabled={!product.inStock || unavailable}
                  className={`flex min-h-11 min-w-12 flex-col items-center justify-center border px-3 font-sans text-[12px] font-semibold transition-colors ${
                    !product.inStock || unavailable
                      ? "cursor-not-allowed border-[#D9C8B5] bg-[#F0EAE1] text-[#B0A090]"
                      : size === option
                      ? "border-[#8A5A36] bg-[#8A5A36] text-white"
                      : "border-[#CDB89F] bg-white/55 text-[#2A1712] hover:border-[#8A5A36]"
                  }`}
                  aria-pressed={size === option}
                >
                  <span>{option}</span>
                  {null}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {product.colors?.length ? (
        <fieldset className="mt-5">
          <legend className="mb-3 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A5A36]">Escolha a cor</legend>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setColor(option)}
                disabled={!product.inStock}
                className={`min-h-11 border px-4 font-sans text-[12px] font-semibold transition-colors ${
                  !product.inStock
                    ? "cursor-not-allowed border-[#D9C8B5] bg-[#F0EAE1] text-[#B0A090]"
                    : color === option
                    ? "border-[#8A5A36] bg-[#E8D9C6] text-[#2A1712]"
                    : "border-[#CDB89F] bg-white/55 text-[#2A1712] hover:border-[#8A5A36]"
                }`}
                aria-pressed={color === option}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="mt-7 grid gap-2 border-y border-[#D9C8B5] py-5 font-sans text-[13px] leading-relaxed text-[#4F3527]">
        <p className="flex items-center gap-2"><Check size={15} strokeWidth={1.5} className="text-[#B88A62]" /> Entrega para todos os EUA</p>
        <p className="flex items-center gap-2"><Check size={15} strokeWidth={1.5} className="text-[#B88A62]" /> Checkout protegido via Square</p>
      </div>

      {error && <p className="mt-4 font-sans text-[12px] font-semibold text-red-800">{error}</p>}

      {product.inStock ? (
        <button
          type="button"
          onClick={addToCart}
          className="mt-6 w-full bg-[#8A5A36] py-4 font-sans text-[12px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#6B4428] active:scale-[0.98]"
        >
          Adicionar ao Carrinho
        </button>
      ) : (
        <button
          type="button"
          disabled
          className="mt-6 w-full cursor-not-allowed bg-[#C4B5A5] py-4 font-sans text-[12px] font-bold uppercase tracking-[0.18em] text-[#7A6A5A]"
        >
          Esgotado
        </button>
      )}
    </div>
  );
}
