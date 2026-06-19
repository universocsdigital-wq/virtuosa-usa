"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import type { Product } from "@/types";

export function ProductPurchasePanel({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [size, setSize] = useState(product.sizes?.length === 1 ? product.sizes[0] : "");
  const [color, setColor] = useState(product.colors?.length === 1 ? product.colors[0] : "");
  const [error, setError] = useState("");

  function addToCart() {
    if (product.sizes?.length && !size) {
      setError("Selecione um tamanho para continuar.");
      return;
    }
    if (product.colors?.length && !color) {
      setError("Selecione uma cor para continuar.");
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
            {product.sizes.map((option) => (
              <button key={option} type="button" onClick={() => setSize(option)} className={`flex h-11 min-w-12 items-center justify-center border px-3 font-sans text-[12px] font-semibold transition-colors ${size === option ? "border-[#8A5A36] bg-[#8A5A36] text-white" : "border-[#CDB89F] bg-white/55 text-[#2A1712] hover:border-[#8A5A36]"}`} aria-pressed={size === option}>
                {option}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      {product.colors?.length ? (
        <fieldset className="mt-5">
          <legend className="mb-3 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A5A36]">Escolha a cor</legend>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((option) => (
              <button key={option} type="button" onClick={() => setColor(option)} className={`min-h-11 border px-4 font-sans text-[12px] font-semibold transition-colors ${color === option ? "border-[#8A5A36] bg-[#E8D9C6] text-[#2A1712]" : "border-[#CDB89F] bg-white/55 text-[#2A1712] hover:border-[#8A5A36]"}`} aria-pressed={color === option}>
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

      <button type="button" onClick={addToCart} className="mt-7 flex min-h-[54px] w-full items-center justify-center rounded-[8px] bg-[#B88A62] px-7 font-sans text-[12px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_9px_22px_rgba(42,23,18,0.16)] transition-all hover:-translate-y-0.5 hover:bg-[#9E714C]">
        Adicionar à sacola {"\u2192"}
      </button>
    </div>
  );
}
