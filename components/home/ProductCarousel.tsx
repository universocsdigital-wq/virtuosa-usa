"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types";

interface ProductCarouselProps {
  products: Product[];
  dark?: boolean;
  ariaLabel: string;
}

export function ProductCarousel({ products, dark = false, ariaLabel }: ProductCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const loopProducts = useMemo(() => [...products, ...products], [products]);

  const normalizePosition = useCallback(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const loopWidth = carousel.scrollWidth / 2;
    if (loopWidth <= 0) return;

    if (carousel.scrollLeft >= loopWidth) carousel.scrollLeft -= loopWidth;
    if (carousel.scrollLeft < 0) carousel.scrollLeft += loopWidth;
  }, []);

  const move = useCallback((direction: "left" | "right") => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const step = Math.max(carousel.clientWidth * 0.52, 180);
    carousel.scrollBy({ left: direction === "right" ? step : -step, behavior: "smooth" });
    window.setTimeout(normalizePosition, 520);
  }, [normalizePosition]);

  useEffect(() => {
    let frameId = 0;
    let lastTime = performance.now();

    function tick(time: number) {
      const carousel = carouselRef.current;
      if (carousel && !isPausedRef.current) {
        const delta = time - lastTime;
        carousel.scrollLeft += delta * 0.018;
        normalizePosition();
      }
      lastTime = time;
      frameId = window.requestAnimationFrame(tick);
    }

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [normalizePosition]);

  const arrowClass = dark
    ? "border-white/25 bg-[#2A1712]/90 text-[#F7D98F] hover:bg-[#4F2107]"
    : "border-[#C6A36A]/45 bg-[#F7F1E8]/95 text-[#4F2107] hover:bg-[#F1DDC1]";

  return (
    <div
      className="relative mx-auto max-w-[1220px]"
      aria-label={ariaLabel}
      onMouseEnter={() => {
        isPausedRef.current = true;
      }}
      onMouseLeave={() => {
        isPausedRef.current = false;
      }}
    >
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
        className="flex gap-3 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5 lg:gap-7"
      >
        {loopProducts.map((product, index) => (
          <div
            key={`${product.id}-${index}`}
            className="w-[47%] shrink-0 sm:w-[calc(50%-10px)] lg:w-[calc(25%-21px)]"
            aria-hidden={index >= products.length}
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
