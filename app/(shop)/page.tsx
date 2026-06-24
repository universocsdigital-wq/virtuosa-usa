import type { Metadata } from "next";
import { Navbar }            from "@/components/layout/Navbar";
import { Footer }            from "@/components/layout/Footer";
import { HeroSection }       from "@/components/home/HeroSection";
import { FeaturedProducts }  from "@/components/home/FeaturedProducts";
import { LaunchInvitation }  from "@/components/home/LaunchInvitation";
import { TrustBar }          from "@/components/home/TrustBar";
import { ManifestoSection }  from "@/components/home/ManifestoSection";
import { BestSellers }       from "@/components/home/BestSellers";
import { CustomerReviews }   from "@/components/home/CustomerReviews";
import { OwnerStory }        from "@/components/home/OwnerStory";
import { getSquareProducts } from "@/lib/square";
import type { Product } from "@/types";
import { reviews, aggregateRating } from "@/lib/data/reviews";

export const metadata: Metadata = {
  title: "Virtuosa USA — Elegance with Purpose",
  description:
    "Timeless pieces for women who value femininity, sophistication, and presence. Shop premium dresses, skirts, and sets crafted with artisanal care.",
  alternates: {
    canonical: "https://virtuosausa.com",
  },
};

// Schema.org JSON-LD para SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  name: "Virtuosa USA",
  url: "https://virtuosausa.com",
  description:
    "Premium feminine boutique for women who value femininity, sophistication, and presence.",
  address: {
    "@type": "PostalAddress",
    addressCountry: "US",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: aggregateRating.score,
    reviewCount: aggregateRating.total,
  },
};

export default async function HomePage() {
  // Buscar produtos do Square em tempo real
  let allProducts: Product[] = [];
  try {
    allProducts = await getSquareProducts();
  } catch {
    // Fallback silencioso — seções ficam vazias mas a página não quebra
  }

  // "Mais Amadas" = as 6 peças mais caras do catálogo
  const bestSellers = [...allProducts]
    .sort((a, b) => b.price - a.price)
    .slice(0, 6);

  // "Em Destaque" = todos os produtos do Square
  const featuredProducts = allProducts;

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-virtuosa-antique-gold focus:text-white focus:px-4 focus:py-2 focus:rounded"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content">
        {/* 1. Hero */}
        <HeroSection />
        {/* 2. Trust Bar */}
        <TrustBar />
        {/* 3. Featured Products */}
        <FeaturedProducts products={featuredProducts} />
        {/* Lançamentos */}
        <LaunchInvitation />
        {/* 4. Manifesto */}
        <ManifestoSection />
        {/* 5. Best Sellers — as peças mais caras = mais exclusivas */}
        <BestSellers products={bestSellers} />
        {/* 6. Customer Reviews */}
        <CustomerReviews reviews={reviews} aggregate={aggregateRating} />
        {/* 7. Owner Story */}
        <OwnerStory />
      </main>
      <Footer />
    </>
  );
}
