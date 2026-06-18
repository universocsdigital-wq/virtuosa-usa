import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/types";

interface CategoryCardsProps {
  categories: Category[];
}

export function CategoryCards({ categories }: CategoryCardsProps) {
  return (
    <section
      id="categories"
      aria-label="Explorar Categorias"
      className="section bg-virtuosa-warm-beige"
    >
      <div className="container-virtuosa">

        {/* Header da seção */}
        <div className="text-center mb-10 lg:mb-14">
          <span className="section-subtitle">Peças Exclusivas</span>
          <h2 className="section-title">Para Cada Ocasião</h2>
          <span className="gold-divider" />
        </div>

        {/* Grid de categorias — desktop 3 colunas, mobile scroll ou coluna */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 lg:gap-7">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>

      </div>
    </section>
  );
}

function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={category.href}
      className="category-card group block"
      aria-label={`Explorar ${category.name}`}
    >
      {/* Imagem */}
      <div className="category-card__image">
        <Image
          src={category.image}
          alt={category.name}
          fill
          sizes="(max-width: 640px) 100vw, 33vw"
          className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.06]"
          quality={85}
        />
      </div>

      {/* Overlay com nome e CTA */}
      <div className="category-card__overlay">
        <h3 className="category-card__label">{category.name}</h3>

        <span
          className="
            inline-flex items-center gap-2
            font-sans text-[11px] font-medium tracking-[0.14em] uppercase
            text-white/90 border-b border-white/50
            pb-0.5 transition-all duration-300
            group-hover:text-white group-hover:border-white group-hover:gap-3
          "
        >
          Conhecer a Coleção
          <svg width="14" height="8" viewBox="0 0 14 8" fill="none" aria-hidden>
            <path d="M1 4h12M9 1l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>
    </Link>
  );
}
