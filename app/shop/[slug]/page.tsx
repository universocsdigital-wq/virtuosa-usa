import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/product/ProductCard";
import { formatPrice } from "@/lib/utils";
import { products } from "@/lib/data/products";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

function checkoutFor(product: (typeof products)[number]) {
  if (product.checkoutUrl) return product.checkoutUrl;
  const text = encodeURIComponent(`Olá, quero comprar esta peça da Virtuosa USA: ${product.name}.`);
  return `https://wa.me/17742043628?text=${text}`;
}

export async function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);

  if (!product) {
    return {
      title: "Peça não encontrada | Virtuosa USA",
    };
  }

  return {
    title: `${product.name} | Virtuosa USA`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);

  if (!product) notFound();

  const relatedProducts = products
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 4);

  return (
    <>
      <Navbar />
      <main className="bg-[#F7F1E8]">
        <section className="container-virtuosa py-10 lg:py-14">
          <div className="mb-6">
            <Link href="/shop" className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-[#B88A62]">
              ← Voltar para coleção
            </Link>
          </div>

          <div className="grid gap-9 lg:grid-cols-[52%_48%] lg:gap-14">
            <div className="relative overflow-hidden rounded-[16px] bg-[#2A1712] shadow-[0_24px_70px_rgba(42,23,18,0.13)]">
              <div className="relative aspect-[4/5]">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 52vw"
                  className="object-cover"
                  quality={92}
                  priority
                />
                <div className="absolute inset-0 texture-linen opacity-20" aria-hidden />
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <p className="mb-3 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-[#B88A62]">
                Seleção Virtuosa
              </p>
              <h1 className="font-serif text-[#2A1712]" style={{ fontSize: "clamp(2.35rem, 4.4vw, 4rem)", lineHeight: 1.02 }}>
                {product.name}
              </h1>

              <p className="mt-5 font-serif text-[2rem] font-semibold leading-none text-[#B88A62]">
                {formatPrice(product.price)}
              </p>
              <p className="mt-2 font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6F5547]">
                Compra protegida via Square
              </p>

              <p className="mt-7 max-w-[540px] font-sans text-[15px] leading-relaxed text-[#6F5547]">
                {product.description}
              </p>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <InfoBlock title="Tamanhos" value={product.sizes?.join(" · ") ?? "Consultar"} />
                <InfoBlock title="Cores" value={product.colors?.join(" · ") ?? "Consultar"} />
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={checkoutFor(product)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[54px] items-center justify-center rounded-[8px] bg-[#B88A62] px-7 font-sans text-[12px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#9E714C]"
                >
                  Comprar Agora →
                </Link>
                <Link
                  href="https://wa.me/17742043628"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[54px] items-center justify-center rounded-[8px] border border-[#4F2107] px-7 font-sans text-[12px] font-bold uppercase tracking-[0.14em] text-[#4F2107] transition-colors hover:bg-[#4F2107] hover:text-white"
                >
                  Tirar dúvida
                </Link>
              </div>

              <div className="mt-6 grid gap-2 border-y border-[#D9C8B5] py-5 font-sans text-[13px] leading-relaxed text-[#4F3527]">
                <p>Entrega para todos os EUA</p>
                <p>Checkout protegido via Square</p>
                <p>Atendimento em português</p>
              </div>
            </div>
          </div>
        </section>

        {relatedProducts.length > 0 && (
          <section className="container-virtuosa pb-14 lg:pb-20">
            <div className="mb-8 text-center">
              <p className="section-subtitle">Também para você</p>
              <h2 className="section-title">Peças da mesma seleção</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
              {relatedProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}

function InfoBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-[#D9C8B5] bg-white/55 p-4">
      <p className="mb-1 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-[#B88A62]">
        {title}
      </p>
      <p className="font-sans text-[13px] text-[#2A1712]">{value}</p>
    </div>
  );
}
