import Image from "next/image";
import Link from "next/link";
import { ProductCarousel } from "@/components/home/ProductCarousel";
import type { Product } from "@/types";

interface FeaturedProductsProps {
  products: Product[];
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  return (
    <section id="colecao" aria-label="Coleção Virtuosa USA" className="section relative overflow-hidden" style={{ backgroundColor: "#170B07" }}>
      <div className="absolute bottom-[-16%] right-[-8%] h-[480px] w-[480px] opacity-[0.055]" aria-hidden>
        <Image src="/svg/MONOGRAMA/Monograma sem Circulo Fundo Branco.svg" alt="" fill className="object-contain" />
      </div>

      <div className="container-virtuosa relative">
        <div className="mb-8 text-center lg:mb-10">
          <span className="mb-3 block font-sans text-[10px] uppercase tracking-[0.22em] text-virtuosa-antique-gold">
            Virtuosa USA
          </span>
          <h2 className="mb-3 font-serif font-normal leading-tight text-white" style={{ fontSize: "clamp(2.15rem, 3vw, 2.95rem)" }}>
            Coleção Virtuosa USA
          </h2>
          <p className="mx-auto mt-3 max-w-[560px] font-sans leading-relaxed text-[#F7F1E8] lg:mt-4" style={{ fontSize: "0.95rem", opacity: 0.9 }}>
            Modelos exclusivos que revelam sua força
            <br />
            na delicadeza de cada detalhe.
          </p>
        </div>

        <ProductCarousel products={products} dark ariaLabel="Peças da Coleção Virtuosa USA" />

        <div className="mt-8 text-center lg:mt-10">
          <Link href="/shop" className="btn-hero-secondary">
            Ver Coleção Completa {"\u2192"}
          </Link>
        </div>
      </div>
    </section>
  );
}
