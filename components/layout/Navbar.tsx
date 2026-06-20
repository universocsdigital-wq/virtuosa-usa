"use client";

import Link from "next/link";
import { User, ShoppingBag, Menu, X } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";

const navLinks = [
  { label: "Lançamentos", href: "/shop#lancamentos", filter: "lancamentos" },
  { label: "Vestidos", href: "/shop#vestidos", filter: "vestidos" },
  { label: "Blusas", href: "/shop#blusas", filter: "blusas" },
  { label: "Conjuntos", href: "/shop#conjuntos", filter: "conjuntos" },
  { label: "Saias", href: "/shop#saias", filter: "saias" },
  { label: "Calças", href: "/shop#calcas", filter: "calcas" },
  { label: "Grupo VIP", href: "https://chat.whatsapp.com/BYkfi3grimA4RvQspUTVFL", external: true },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems: cartCount, openCart } = useCart();
  const pathname = usePathname();

  function handleNavClick(event: React.MouseEvent<HTMLAnchorElement>, link: (typeof navLinks)[number]) {
    if (pathname !== "/shop" || !("filter" in link) || !link.filter) return;

    event.preventDefault();
    window.history.replaceState(null, "", `/shop#${link.filter}`);
    window.dispatchEvent(new CustomEvent("virtuosa-category-filter", { detail: link.filter }));
    setMobileOpen(false);
  }

  return (
    <>
      <header
        className="fixed left-0 right-0 top-0 z-nav transition-all duration-500"
        style={{
          backgroundColor: "#4F2107",
          borderBottom: "1px solid rgba(247,210,132,0.20)",
          boxShadow: "none",
        }}
      >
        <div className="container-virtuosa">
          <div className="relative flex h-[76px] items-center justify-center lg:h-[84px]">
            <button
              className="absolute left-0 p-2 text-[#F1DDC1] transition-colors hover:text-[#F5D58A] lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="h-6 w-6" strokeWidth={1.35} />
            </button>

            <Link
              href="/"
              className="brand-logo-reference brand-logo-reference--header relative z-10 flex h-[60px] w-[226px] items-center justify-center overflow-visible lg:h-[72px] lg:w-[286px]"
              aria-label="Virtuosa USA"
            />

            <div className="absolute right-0 flex items-center gap-4">
              <Link href="/conta" className="group flex items-center gap-2 p-2 text-[#F1DDC1] transition-colors hover:text-[#F5D58A]" aria-label="Minha conta e pedidos">
                <User className="h-5 w-5" strokeWidth={1.25} />
                <span className="hidden font-sans text-[10px] font-semibold uppercase tracking-[0.12em] lg:inline">Conta</span>
              </Link>
              <button type="button" onClick={openCart} className="group relative flex items-center gap-2 p-2 text-[#F1DDC1] transition-colors hover:text-[#F5D58A]" aria-label={`Abrir sacola - ${cartCount} itens`}>
                <ShoppingBag className="h-5 w-5" strokeWidth={1.25} />
                <span className="hidden font-sans text-[10px] font-semibold uppercase tracking-[0.12em] lg:inline">Sacola</span>
                {cartCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-virtuosa-antique-gold text-[9px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <nav className="hidden h-[42px] items-center justify-center gap-7 border-t border-white/10 lg:flex xl:gap-9" aria-label="Categorias">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                onClick={(event) => handleNavClick(event, link)}
                className="whitespace-nowrap font-sans text-[10.5px] font-bold uppercase tracking-[0.13em] text-[#F1DDC1] transition-colors hover:text-[#F5D58A]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="h-[76px] lg:h-[126px]" aria-hidden />

      {mobileOpen && (
        <div className="fixed inset-0 z-modal lg:hidden">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <nav className="absolute bottom-0 left-0 top-0 flex w-[290px] flex-col overflow-hidden" style={{ backgroundColor: "#3A1708" }}>
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <span className="brand-logo-reference brand-logo-reference--drawer relative block h-12 w-[170px] overflow-visible" aria-label="Virtuosa USA" />
              <button onClick={() => setMobileOpen(false)} className="p-2 text-[#F1DDC1] transition-colors hover:text-[#F5D58A]" aria-label="Fechar menu">
                <X className="h-5 w-5" strokeWidth={1.35} />
              </button>
            </div>

            <ul className="flex flex-col px-6 pt-4">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    className="flex items-center border-b border-[#F7D98F]/18 py-4 font-sans text-[13px] font-bold uppercase tracking-[0.14em] text-[#F7E6C9] transition-colors hover:text-[#F7D98F]"
                    onClick={(event) => handleNavClick(event, link)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="absolute -bottom-16 -right-14 h-48 w-48 opacity-[0.08]" aria-hidden>
              <img src="/svg/MONOGRAMA/Monograma sem Circulo Fundo Branco.svg" alt="" className="h-full w-full object-contain" />
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
