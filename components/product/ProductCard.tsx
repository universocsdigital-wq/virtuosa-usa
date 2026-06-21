"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  dark?: boolean;
}

export function ProductCard({ product }: ProductCardProps) {
  const productHref = `/shop/${product.slug}`;

  return (
    <article className="group overflow-hidden rounded-[8px] border border-[#D9C8B5]/70 bg-[#FFFDF8] shadow-[0_8px_22px_rgba(42,23,18,0.07)] transition-transform duration-300 hover:-translate-y-1 sm:rounded-[14px] sm:shadow-[0_12px_34px_rgba(42,23,18,0.08)]">
      <Link href={productHref} className="block" aria-label={`Ver peça ${product.name}`}>
        <div className="relative aspect-[4/5] overflow-hidden bg-[#23110B]">
          <div className="absolute inset-0 editorial-product-placeholder" aria-hidden />
          <div className="absolute inset-0 texture-linen opacity-70" aria-hidden />

          <div
            className="absolute left-1/2 top-1/2 h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2 opacity-[0.11]"
            style={{
              backgroundImage: "url('/svg/MONOGRAMA/Monograma sem Circulo Fundo Claro.svg.svg')",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "contain",
            }}
            aria-hidden
          />
        </div>
      </Link>

      <div className="px-2.5 pb-3 pt-3 text-center sm:px-4 sm:pb-4 sm:pt-4">
        <Link href={productHref}>
          <h3
            className="mx-auto mb-2 min-h-[36px] max-w-[230px] font-sans text-[0.76rem] font-semibold leading-snug text-[#2A1712] transition-colors hover:text-[#8A5A36] sm:mb-3 sm:min-h-[42px] sm:text-[0.94rem]"
          >
            {product.name}
          </h3>
        </Link>

        <p className="mb-1 font-serif text-[1.12rem] font-semibold leading-none text-[#B88A62] sm:text-[1.5rem]">
          {formatPrice(product.price)}
        </p>

        <Link
          href={productHref}
          className="mt-3 flex min-h-[40px] w-full items-center justify-center rounded-[6px] bg-[#B88A62] px-2 font-sans text-[9px] font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#9E714C] sm:mt-5 sm:min-h-[44px] sm:rounded-[8px] sm:px-4 sm:text-[11px] sm:tracking-[0.14em]"
          aria-label={`Ver peça ${product.name}`}
        >
          Ver Peça {"\u2192"}
        </Link>
      </div>
    </article>
  );
}
