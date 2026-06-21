"use client";

import Image from "next/image";
import { useRef } from "react";
import type { Review } from "@/types";

interface CustomerReviewsProps {
  reviews: Review[];
  aggregate: { score: number; total: number };
}

export function CustomerReviews({ reviews }: CustomerReviewsProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  function move(direction: "left" | "right") {
    carouselRef.current?.scrollBy({
      left: direction === "right" ? 360 : -360,
      behavior: "smooth",
    });
  }

  return (
    <section
      id="reviews"
      aria-label="Depoimentos das clientes"
      className="relative overflow-hidden bg-[#F8F3EB] pb-[24px] pt-[30px] lg:pb-[32px] lg:pt-[36px]"
    >
      <div
        className="pointer-events-none absolute right-[-3%] top-1/2 -translate-y-1/2"
        style={{ width: "min(360px, 42vw)", height: "min(360px, 42vw)", opacity: 0.03 }}
        aria-hidden
      >
        <Image src="/svg/MONOGRAMA/Monograma sem Circulo Fundo Claro.svg.svg" alt="" fill className="object-contain" />
      </div>

      <div className="container-virtuosa relative">
        <div className="mb-5 text-center lg:mb-7">
          <span className="section-subtitle">Virtuosas</span>
          <h2 className="section-title">Palavras Delas</h2>
          <span className="gold-divider" />
          <p className="mx-auto mt-4 max-w-xl font-sans text-[13px] leading-relaxed text-virtuosa-light-brown">
            Histórias reais compartilhadas por mulheres
            <br />
            que já receberam a experiência Virtuosa.
          </p>
        </div>

        <div className="relative mx-auto max-w-[1160px]">
          <button
            type="button"
            onClick={() => move("left")}
            className="absolute left-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#C6A36A]/45 bg-[#F7F1E8]/95 text-[#4F2107] shadow-[0_8px_22px_rgba(42,23,18,0.14)] lg:-left-3 lg:h-11 lg:w-11"
            aria-label="Ver depoimentos anteriores"
          >
            ←
          </button>

          <div
            ref={carouselRef}
            className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:gap-5 lg:px-0"
          >
            {reviews.map((review) => (
              <div key={review.id} className="w-[82vw] max-w-[320px] shrink-0 snap-start lg:w-[360px] lg:max-w-[360px]">
                <ReviewCard review={review} />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => move("right")}
            className="absolute right-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#C6A36A]/45 bg-[#F7F1E8]/95 text-[#4F2107] shadow-[0_8px_22px_rgba(42,23,18,0.14)] lg:-right-3 lg:h-11 lg:w-11"
            aria-label="Ver próximos depoimentos"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="relative h-full bg-virtuosa-cream p-5 lg:p-7" style={{ borderRadius: "2px" }} aria-label={`Depoimento de ${review.author}`}>
      <div className="pointer-events-none absolute left-7 top-5 select-none font-serif italic leading-none text-[#C6A36A]/15" style={{ fontSize: "68px" }} aria-hidden>
        &ldquo;
      </div>

      <div className="relative">
        <blockquote className="mb-5 font-serif text-[0.98rem] italic leading-[1.62] text-virtuosa-deep-brown">
          {review.text}
        </blockquote>
        <div className="mb-4 h-px w-8 bg-[#C6A36A]/40" aria-hidden />
        <footer className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C6A36A]/15" aria-hidden>
            <span className="font-serif text-sm text-virtuosa-antique-gold">{review.author.charAt(0)}</span>
          </div>
          <div>
            <p className="font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-virtuosa-deep-brown">{review.author}</p>
            {review.verified && <p className="mt-0.5 font-sans text-[10px] tracking-[0.08em] text-virtuosa-antique-gold">Cliente Virtuosa</p>}
          </div>
        </footer>
      </div>
    </article>
  );
}
