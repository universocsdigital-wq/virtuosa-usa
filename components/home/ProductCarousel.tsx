"use client";

import { useEffect, useRef } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types";

interface ProductCarouselProps {
  products: Product[];
  dark?: boolean;
  ariaLabel: string;
}

export function ProductCarousel({ products, dark = false, ariaLabel }: ProductCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  function move(direction: "left" | "right") {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const step = Math.max(carousel.clientWidth * 0.52, 180);
    const reachedEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 12;
    const reachedStart = carousel.scrollLeft <= 12;

    if (direction === "right" && reachedEnd) {
      carousel.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }

    if (direction === "left" && reachedStart) {
      carousel.scrollTo({ left: carousel.scrollWidth, behavior: "smooth" });
      return;
    }

    carousel.scrollBy({ left: direction === "right" ? step : -step, behavior: "smooth" });
  }

  useEffect(() => {
    const timer = window.setInterval(() => move("right"), 5200);
    return () => window.clearInterval(timer);
  }, []);

  const arrowClass = dark
    ? "border-white/25 bg-[#2A1712]/90 text-[#F7D98F] hover:bg-[#4F2107]"
    : "border-[#C6A36A]/45 bg-[#F7F1E8]/95 text-[#4F2107] hover:bg-[#F1DDC1]";

  return (
    <div className="relative mx-auto max-w-[1220px]" aria-label={ariaLabel}>
      <button
        type="button"
        onClick={() => move("left")}
        className={`absolute left-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border shadow-[0_8px_22px_rgba(42,23,18,0.14)] transition-colors lg:-left-3 lg:h-11 lg:w-11 ${arrowClass}`}
        aria-label="Ver peças anteriores"
      >
        ←
      </button>

      <div
        ref={carouselRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5 lg:gap-7"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[47%] shrink-0 snap-start sm:w-[calc(50%-10px)] lg:w-[calc(25%-21px)]"
          >
            <ProductCard product={product} dark={dark} />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => move("right")}
        className={`absolute right-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border shadow-[0_8px_22px_rgba(42,23,18,0.14)] transition-colors lg:-right-3 lg:h-11 lg:w-11 ${arrowClass}`}
        aria-label="Ver próximas peças"
      >
        →
      </button>
    </div>
  );
}
