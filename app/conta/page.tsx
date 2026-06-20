import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AccountClient } from "@/components/account/AccountClient";

export const metadata: Metadata = {
  title: "Minha Conta | Virtuosa USA",
  description: "Consulte seus pedidos e acompanhe seus envios da Virtuosa USA.",
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
