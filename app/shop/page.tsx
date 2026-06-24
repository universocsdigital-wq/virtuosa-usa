import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ShopClient } from "@/components/shop/ShopClient";
import { getSquareProducts } from "@/lib/square";

export const metadata: Metadata = {
  title: "Peças Selecionadas para Você | Virtuosa USA",
  description: "Explore vestidos, blusas, saias, conjuntos e calças da Virtuosa USA.",
};

export const revalidate = 300; // revalidar a cada 5 minutos

export default async function ShopPage() {
  const products = await getSquareProducts();

  return (
    <>
      <Navbar />
      <ShopClient products={products} />
      <Footer />
    </>
  );
}
