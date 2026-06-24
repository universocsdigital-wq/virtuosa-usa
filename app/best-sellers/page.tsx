import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/product/ProductCard";
import { getSquareProducts } from "@/lib/square";

export const metadata: Metadata = {
  title: "Mais Amadas | Virtuosa USA",
  description: "As peças mais exclusivas da Virtuosa USA — selecionadas com cuidado para mulheres que valorizam sofisticação e presença.",
};

export const revalidate = 300;

export default async function BestSellersPage() {
  let products = [];
  try {
    const all = await getSquareProducts();
    // Ordenar por preço decrescente (mais caras = mais exclusivas)
    products = [...all].sort((a, b) => b.price - a.price);
  } catch {
    // fallback silencioso
  }

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-[#F7F1E8]">
        {/* Header */}
        <section className="bg-[#2A1712] py-16 text-center">
          <p className="mb-3 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-[#B88A62]">
            Seleção Exclusiva
          </p>
          <h1
            className="font-serif text-[#F1DDC1]"
            style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)", lineHeight: 1.05 }}
          >
            Mais Amadas
          </h1>
          <p className="mx-auto mt-4 max-w-md font-sans text-[13px] leading-relaxed text-[#C4A882]">
            As peças que mais encantam — escolhidas por quem valoriza feminilidade, sofisticação e presença.
          </p>
        </section>

        {/* Grid de produtos */}
        <section className="container-virtuosa py-12 lg:py-16">
          {products.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-serif text-2xl text-[#2A1712]">Coleção em atualização</p>
              <p className="mt-3 font-sans text-sm text-[#6F5547]">Volte em breve para ver as novas peças.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
