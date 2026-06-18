import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "About",
  description: "The story behind Virtuosa USA — femininity, presence, and timeless elegance.",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen">
        {/* TODO: About page */}
      </main>
      <Footer />
    </>
  );
}
