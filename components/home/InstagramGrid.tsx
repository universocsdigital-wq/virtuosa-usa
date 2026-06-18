"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

const instagramImages = [
  { id: 1, src: "/images/instagram/post-1.jpg", alt: "Café e momentos tranquilos - Virtuosa USA" },
  { id: 2, src: "/images/instagram/post-2.jpg", alt: "Eventos e celebrações elegantes" },
  { id: 3, src: "/images/instagram/post-3.jpg", alt: "Família e relacionamentos" },
  { id: 4, src: "/images/instagram/post-4.jpg", alt: "Momentos especiais" },
  { id: 5, src: "/images/instagram/post-5.jpg", alt: "Moda elegante - detalhes de peças" },
  { id: 6, src: "/images/instagram/post-6.jpg", alt: "Ambientes sofisticados" },
];

export function InstagramGrid() {
  const carouselRef = useRef<HTMLDivElement>(null);

  function scrollCarousel(direction: "left" | "right") {
    carouselRef.current?.scrollBy({
      left: direction === "right" ? 280 : -280,
      behavior: "smooth",
    });
  }

  return (
    <section
      id="instagram"
      aria-label="Instagram @virtuosa.usa"
      className="bg-virtuosa-warm-beige py-[34px] lg:py-[42px]"
    >
      <div className="container-virtuosa">
        <div className="mb-7 text-center">
          <span className="section-subtitle">Vida Virtuosa</span>
          <h2 className="section-title">@virtuosa.usa</h2>
          <span className="gold-divider" />

          <div className="mt-6">
            <Link
              href="https://www.instagram.com/virtuosa.usa/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary inline-flex items-center gap-2"
              aria-label="Seguir a Virtuosa USA no Instagram"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
              </svg>
              Siga no Instagram
            </Link>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => scrollCarousel("left")}
            className="absolute left-1 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#C6A36A]/45 bg-[#F7F1E8] text-[#4F2107] shadow-[0_10px_28px_rgba(42,23,18,0.12)] transition-colors hover:bg-[#F1DDC1] md:-left-1"
            aria-label="Ver fotos anteriores"
          >
            ←
          </button>

          <div ref={carouselRef} className="flex snap-x gap-3 overflow-x-auto scroll-smooth pb-3">
            {instagramImages.map((post, index) => (
              <InstagramPost key={post.id} post={post} priority={index < 3} />
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollCarousel("right")}
            className="absolute right-1 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#C6A36A]/45 bg-[#F7F1E8] text-[#4F2107] shadow-[0_10px_28px_rgba(42,23,18,0.12)] transition-colors hover:bg-[#F1DDC1] md:-right-1"
            aria-label="Ver próximas fotos"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}

function InstagramPost({
  post,
  priority,
}: {
  post: { id: number; src: string; alt: string };
  priority?: boolean;
}) {
  return (
    <Link
      href="https://www.instagram.com/virtuosa.usa/"
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block aspect-square w-[190px] flex-none snap-start overflow-hidden rounded-[4px] bg-[#2A1712] md:w-[220px] lg:w-[250px]"
      aria-label={post.alt}
    >
      <Image
        src={post.src}
        alt={post.alt}
        fill
        sizes="250px"
        className="object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
        quality={80}
        priority={priority}
      />
      <div className="absolute inset-0 bg-[#2A1712]/12 transition-colors group-hover:bg-[#2A1712]/30" aria-hidden />
    </Link>
  );
}
