import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ShopClient } from "@/components/shop/ShopClient";
import { products } from "@/lib/data/products";

export const metadata: Metadata = {
  title: "Peças Selecionadas para Você | Virtuosa USA",
  description: "Explore vestidos, blusas, saias, conjuntos e calças da Virtuosa USA.",
};

export default function ShopPage() {
  return (
    <>
      <Navbar />
      <ShopClient products={products} />
      <Footer />
    </>
  );
}
