import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AccountClient } from "@/components/account/AccountClient";

export const metadata: Metadata = {
  title: "Minha Conta",
  description: "Consulte seus pedidos e acompanhe seus envios da Virtuosa USA.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <>
      <Navbar />
      <AccountClient />
      <Footer />
    </>
  );
}
