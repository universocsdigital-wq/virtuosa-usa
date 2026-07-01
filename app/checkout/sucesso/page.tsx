import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CheckoutSuccess } from "@/components/cart/CheckoutSuccess";

export const metadata: Metadata = {
  title: "Pedido recebido | Virtuosa USA",
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage() {
  return (
    <>
      <Navbar />
      <CheckoutSuccess />
      <Footer />
    </>
  );
}
