import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CheckoutSuccess } from "@/components/cart/CheckoutSuccess";

export default function CheckoutSuccessPage() {
  return (
    <>
      <Navbar />
      <CheckoutSuccess />
      <Footer />
    </>
  );
}
