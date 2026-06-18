import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "New Arrivals",
  description: "Discover the latest additions to the Virtuosa USA collection.",
};

export default function NewArrivalsPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen">
        {/* TODO: New arrivals grid */}
      </main>
      <Footer />
    </>
  );
}
