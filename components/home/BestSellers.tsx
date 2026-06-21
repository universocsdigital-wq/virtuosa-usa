import Image from "next/image";
import Link from "next/link";
import { ProductCarousel } from "@/components/home/ProductCarousel";
import type { Product } from "@/types";

interface BestSellersProps {
  products: Product[];
}

export function BestSellers({ products }: BestSellersProps) {
  return (
    <section id="best-sellers" aria-label="Mais Amadas" className="section relative overflow-hidden bg-virtuosa-champagne">
      <div className="absolute left-[-7%] top-1/2 h-[420px] w-[420px] -translate-y-1/2 opacity-[0.028]" aria-hidden>
        <Image src="/svg/MONOGRAMA/Monograma sem Circulo Fundo Claro.svg.svg" alt="" fill className="object-contain" />
      </div>

      <div className="container-virtuosa relative">
        <div className="mb-10 text-center">
          <h2 className="section-title">As mais amadas</h2>
          <p className="mx-auto mt-5 max-w-[560px] font-sans text-[0.72rem] leading-relaxed text-virtuosa-light-brown sm:text-[0.82rem] lg:text-[0.95rem]">
            <span className="block whitespace-nowrap">As peças que nossas clientes mais amam</span>
            <span className="block whitespace-nowrap">escolhidas com cuidado, e usadas com elegância</span>
          </p>
        </div>

        <ProductCarousel products={products} ariaLabel="Peças mais amadas pelas clientes" />

        <div className="mt-10 text-center">
          <Link href="/shop#lancamentos" className="btn-secondary">
            VER TODAS {"\u2192"}
          </Link>
        </div>
      </div>
    </section>
  );
}
