"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";

export function CheckoutSuccess() {
  const { clearCart } = useCart();
  const [returnedFromCheckout, setReturnedFromCheckout] = useState<boolean | null>(null);
  useEffect(() => {
    const pendingOrder = window.sessionStorage.getItem("virtuosa-pending-order");
    if (!pendingOrder) {
      setReturnedFromCheckout(false);
      return;
    }
    clearCart();
    window.sessionStorage.removeItem("virtuosa-pending-order");
    setReturnedFromCheckout(true);
  }, [clearCart]);

  if (returnedFromCheckout === null) return null;

  if (!returnedFromCheckout) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#F8F3EB] px-6 py-16 text-center">
        <div className="max-w-xl">
          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#B88A62]">Virtuosa USA</p>
          <h1 className="mt-3 font-serif text-4xl text-[#2A1712] sm:text-5xl">Acompanhe seus pedidos</h1>
          <p className="mt-5 font-sans text-sm leading-relaxed text-[#6F5547]">Entre na sua conta para consultar pedidos e informações de entrega.</p>
          <Link href="/conta" className="mt-8 inline-flex min-h-12 items-center justify-center bg-[#8A5A36] px-7 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_8px_20px_rgba(42,23,18,0.14)]">Acessar minha conta {"\u2192"}</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[#F8F3EB] px-6 py-16 text-center">
      <div className="max-w-xl">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#B88A62] text-[#B88A62]"><Check size={24} strokeWidth={1.4} /></span>
        <p className="mt-6 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#B88A62]">Pedido recebido</p>
        <h1 className="mt-3 font-serif text-4xl text-[#2A1712] sm:text-5xl">Obrigada por escolher a Virtuosa</h1>
        <p className="mt-5 font-sans text-sm leading-relaxed text-[#6F5547]">A confirmação e os detalhes do pedido serão enviados pela Square.</p>
        <Link href="/shop" className="mt-8 inline-flex min-h-12 items-center justify-center bg-[#8A5A36] px-7 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_8px_20px_rgba(42,23,18,0.14)]">Voltar à coleção {"\u2192"}</Link>
      </div>
    </main>
  );
}
