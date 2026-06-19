"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types";

interface BestSellersProps {
  products: Product[];
}

export function BestSellers({ products }: BestSellersProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  function scrollCarousel(direction: "left" | "right") {
    carouselRef.current?.scrollBy({
      left: direction === "right" ? 320 : -320,
      behavior: "smooth",
    });
  }

  return (
    <section id="best-sellers" aria-label="Mais Amadas" className="section relative overflow-hidden bg-virtuosa-champagne">
      <div className="absolute left-[-7%] top-1/2 h-[420px] w-[420px] -translate-y-1/2 opacity-[0.028]" aria-hidden>
        <Image src="/svg/MONOGRAMA/Monograma sem Circulo Fundo Claro.svg.svg" alt="" fill className="object-contain" />
      </div>

      <div className="container-virtuosa relative">
        <div className="mb-10 text-center">
          <h2 className="section-title">Mais Amadas</h2>
          <p className="mx-auto mt-5 max-w-[560px] font-sans leading-relaxed text-virtuosa-light-brown" style={{ fontSize: "0.95rem" }}>
            As peças que nossas clientes mais amam,
            <br />
            escolhidas com cuidado e usadas com elegância.
          </p>
        </div>

        <div className="relative mx-auto max-w-[1220px]">
          <button
            type="button"
            onClick={() => scrollCarousel("left")}
            className="absolute left-1 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#C6A36A]/45 bg-[#F7F1E8] text-[#4F2107] shadow-[0_10px_28px_rgba(42,23,18,0.12)] transition-colors hover:bg-[#F1DDC1] lg:-left-2"
            aria-label="Ver peças anteriores"
          >
            ←
          </button>

          <div
            ref={carouselRef}
            className="flex snap-x gap-5 overflow-x-auto scroll-smooth pb-3 lg:gap-7"
          >
            {products.slice(0, 6).map((product) => (
              <div key={product.id} className="w-[78vw] max-w-[290px] flex-none snap-start sm:w-[45vw] lg:w-[270px]">
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollCarousel("right")}
            className="absolute right-1 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#C6A36A]/45 bg-[#F7F1E8] text-[#4F2107] shadow-[0_10px_28px_rgba(42,23,18,0.12)] transition-colors hover:bg-[#F1DDC1] lg:-right-2"
            aria-label="Ver próximas peças"
          >
            →
          </button>
        </div>

        <div className="mt-10 text-center">
          <Link href="/shop#lancamentos" className="btn-secondary">
            VER TODAS →
          </Link>
        </div>
      </div>
    </section>
  );
}
