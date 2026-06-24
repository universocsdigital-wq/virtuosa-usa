import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductPurchasePanel } from "@/components/product/ProductPurchasePanel";
import { formatPrice } from "@/lib/utils";
import { getSquareProducts, getSquareProductBySlug } from "@/lib/square";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 300; // revalidar a cada 5 minutos

export async function generateStaticParams() {
  const products = await getSquareProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getSquareProductBySlug(slug);
  if (!product) return { title: "Peça não encontrada | Virtuosa USA" };
  return { title: `${product.name} | Virtuosa USA`, description: product.description };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getSquareProductBySlug(slug);
  if (!product) notFound();

  const allProducts = await getSquareProducts();
  const relatedProducts = allProducts
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 4);

  return (
    <>
      <Navbar />
      <main className="bg-[#F7F1E8]">
        <section className="container-virtuosa py-10 lg:py-14">
          <div className="mb-6">
            <Link href="/shop" className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-[#B88A62]">
              {"\u2190"} Voltar para coleção
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
                  unoptimized={product.image.includes("s3.us-west-2.amazonaws.com")}
                />
                <div className="absolute inset-0 texture-linen opacity-20" aria-hidden />
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <p className="mb-3 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-[#B88A62]">Seleção Virtuosa</p>
              <h1 className="font-serif text-[#2A1712]" style={{ fontSize: "clamp(2.35rem, 4.4vw, 4rem)", lineHeight: 1.02 }}>{product.name}</h1>
              <p className="mt-5 font-serif text-[2rem] font-semibold leading-none text-[#B88A62]">{formatPrice(product.price)}</p>
              {product.description && (
                <p className="mt-7 max-w-[540px] font-sans text-[15px] leading-relaxed text-[#6F5547]">{product.description}</p>
              )}
              <ProductPurchasePanel product={product} />
            </div>
          </div>
        </section>
        {relatedProducts.length > 0 && (
          <section className="container-virtuosa pb-14 lg:pb-20">
            <div className="mb-8 text-center">
              <p className="section-subtitle">Também para você</p>
              <h2 className="section-title">Peças da mesma seleção</h2>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {relatedProducts.map((item) => <ProductCard key={item.id} product={item} />)}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
