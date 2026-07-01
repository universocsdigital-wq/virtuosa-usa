"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/components/cart/CartProvider";

export function CartDrawer() {
  const { items, totalItems, totalPrice, isOpen, closeCart, removeItem, updateQuantity } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<"shipping" | "pickup">("shipping");
  const shippingPrice = fulfillmentType === "shipping" ? 12 : 0;

  async function checkout() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/square/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fulfillmentType,
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
          })),
        }),
      });
      const data = (await response.json()) as { checkoutUrl?: string; orderId?: string; error?: string };
      if (!response.ok || !data.checkoutUrl) throw new Error(data.error ?? "Não foi possível iniciar o checkout.");
      if (data.orderId) window.sessionStorage.setItem("virtuosa-pending-order", data.orderId);
      window.location.assign(data.checkoutUrl);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Não foi possível iniciar o checkout.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150]" role="dialog" aria-modal="true" aria-label="Sua sacola">
      <button type="button" className="absolute inset-0 bg-[#170B07]/55 backdrop-blur-[2px]" onClick={closeCart} aria-label="Fechar sacola" />
      <aside className="absolute bottom-0 right-0 top-0 flex w-full max-w-[480px] flex-col bg-[#FCF8F2] shadow-[-20px_0_60px_rgba(23,11,7,0.22)]">
        <header className="flex min-h-[68px] items-center justify-between border-b border-[#D9C8B5] px-5 sm:px-6">
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} strokeWidth={1.4} className="text-[#B88A62]" />
            <div>
              <h2 className="font-serif text-2xl text-[#2A1712]">Sua Sacola</h2>
              <p className="font-sans text-[11px] text-[#6F5547]">{totalItems} {totalItems === 1 ? "peça" : "peças"}</p>
            </div>
          </div>
          <button type="button" onClick={closeCart} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D9C8B5] text-[#2A1712]" aria-label="Fechar sacola">
            <X size={20} strokeWidth={1.4} />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <ShoppingBag size={34} strokeWidth={1.1} className="mb-5 text-[#B88A62]" />
            <p className="font-serif text-3xl text-[#2A1712]">Sua sacola está vazia</p>
            <p className="mt-3 max-w-xs font-sans text-sm leading-relaxed text-[#6F5547]">Explore a coleção e escolha as peças que traduzem sua essência.</p>
            <button type="button" onClick={closeCart} className="mt-7 border border-[#B88A62] bg-[#B88A62] px-7 py-3 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_7px_18px_rgba(42,23,18,0.12)]">
              Continuar escolhendo {"\u2192"}
            </button>
          </div>
        ) : (
          <>
            <div className="min-h-[30vh] flex-1 overflow-y-auto px-5 py-2">
              {items.map((item) => {
                const key = `${item.product.id}-${item.size ?? ""}-${item.color ?? ""}`;
                return (
                  <article key={key} className="border-b border-[#E4D5C3] py-4">
                    <div className="flex justify-between gap-4">
                      <div>
                        <h3 className="font-serif text-[1.15rem] text-[#2A1712]">{item.product.name}</h3>
                        <p className="mt-1 font-sans text-[11px] text-[#6F5547]">
                          {[item.size && `Tamanho ${item.size}`, item.color].filter(Boolean).join(" · ")}
                        </p>
                        <p className="mt-2 font-serif text-lg text-[#B88A62]">{formatPrice(item.product.price)}</p>
                      </div>
                      <button type="button" onClick={() => removeItem(item.product.id, item.size, item.color)} className="h-9 w-9 text-[#8A5A36]" aria-label={`Remover ${item.product.name}`}>
                        <Trash2 size={17} strokeWidth={1.4} />
                      </button>
                    </div>
                    <div className="mt-4 inline-flex items-center border border-[#D9C8B5] bg-white/60">
                      <button type="button" onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity - 1)} className="flex h-9 w-9 items-center justify-center" aria-label="Diminuir quantidade"><Minus size={14} /></button>
                      <span className="min-w-9 text-center font-sans text-[12px] font-semibold">{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity + 1)} className="flex h-9 w-9 items-center justify-center" aria-label="Aumentar quantidade"><Plus size={14} /></button>
                    </div>
                  </article>
                );
              })}
            </div>

            <footer className="border-t border-[#D9C8B5] bg-[#F8F3EB] p-4 sm:p-5">
              <fieldset className="mb-3">
                <legend className="mb-2 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[#4F3527]">Entrega</legend>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setFulfillmentType("shipping")} className={`min-h-[46px] border px-3 text-left font-sans text-[10px] leading-relaxed ${fulfillmentType === "shipping" ? "border-[#8A5A36] bg-[#E8D9C6] text-[#2A1712]" : "border-[#D9C8B5] bg-white/60 text-[#6F5547]"}`}>
                    <strong className="block text-[11px]">Envio USPS</strong>
                    US$ 12 · com rastreamento
                  </button>
                  <button type="button" onClick={() => setFulfillmentType("pickup")} className={`min-h-[46px] border px-3 text-left font-sans text-[10px] leading-relaxed ${fulfillmentType === "pickup" ? "border-[#8A5A36] bg-[#E8D9C6] text-[#2A1712]" : "border-[#D9C8B5] bg-white/60 text-[#6F5547]"}`}>
                    <strong className="block text-[11px]">Retirada local</strong>
                    Grátis · Milford, MA
                  </button>
                </div>
              </fieldset>

              <div className="mb-2 flex items-center justify-between font-sans text-[12px] text-[#6F5547]">
                <span>Subtotal</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="mb-3 flex items-center justify-between font-sans text-[12px] text-[#6F5547]">
                <span>{fulfillmentType === "shipping" ? "Frete USPS" : "Retirada local"}</span>
                <span>{shippingPrice ? formatPrice(shippingPrice) : "Grátis"}</span>
              </div>
              <div className="mb-3 flex items-end justify-between border-t border-[#D9C8B5] pt-3">
                <span className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-[#4F3527]">Total</span>
                <span className="font-serif text-2xl text-[#2A1712]">{formatPrice(totalPrice + shippingPrice)}</span>
              </div>
              <p className="mb-3 font-sans text-[10px] leading-relaxed text-[#6F5547]">Pagamento protegido pela Square. Endereço solicitado apenas para envio.</p>
              {error && <p className="mb-4 border border-red-300 bg-red-50 px-3 py-2 font-sans text-[12px] text-red-800">{error}</p>}
              <button type="button" onClick={checkout} disabled={loading} className="flex min-h-[48px] w-full items-center justify-center bg-[#8A5A36] px-6 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_8px_20px_rgba(42,23,18,0.16)] transition-colors hover:bg-[#6F452C] disabled:cursor-wait disabled:opacity-60">
                {loading ? "Preparando checkout..." : "Finalizar compra \u2192"}
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
