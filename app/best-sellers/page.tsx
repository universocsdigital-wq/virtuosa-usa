import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Best Sellers",
  description: "The most loved pieces at Virtuosa USA.",
};

export default function BestSellersPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen">
        {/* TODO: Best sellers grid */}
      </main>
      <Footer />
    </>
  );
}
