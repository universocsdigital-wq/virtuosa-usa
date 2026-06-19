import Link from "next/link";

const curationLinks = [
  { label: "Coleção Virtuosa USA", href: "/#colecao" },
  { label: "Mais Amadas", href: "/#best-sellers" },
  { label: "Nossa Essência", href: "/#manifesto" },
];

const aboutLinks = [
  { label: "O Coração por Trás da Virtuosa", href: "/#elaine-soares" },
  { label: "Depoimentos", href: "/#reviews" },
  { label: "Entregas e Trocas", href: "/entregas-e-trocas" },
];

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/virtuosa.usa/", external: true },
  { label: "Grupo VIP", href: "https://wa.me/c/17742043628", external: true },
];

export function Footer() {
  return (
    <>
      <footer className="relative overflow-hidden" style={{ backgroundColor: "#4F2107" }} aria-label="Rodapé">
        <div className="absolute inset-0 texture-linen opacity-30" aria-hidden />
        <div className="absolute bottom-[-8%] right-[4%] h-[360px] w-[360px] opacity-[0.055] lg:h-[480px] lg:w-[480px]" aria-hidden>
          <img src="/svg/MONOGRAMA/Monograma sem Circulo Fundo Branco.svg" alt="" className="h-full w-full object-contain" />
        </div>

        <div className="container-virtuosa relative py-12 lg:py-14">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 xl:grid-cols-[1.28fr_1fr_1.15fr_1.25fr_0.95fr] xl:gap-12">
            <div>
              <Link href="/" className="brand-logo-reference brand-logo-reference--footer relative mb-5 block h-[82px] w-[240px] overflow-visible" aria-label="Virtuosa USA" />
            </div>

            <FooterColumn title="Curadoria" links={curationLinks} />
            <FooterColumn title="Sobre" links={aboutLinks} />

            <div>
              <h4 className="mb-4 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F7D98F]">
                Compra Segura
              </h4>
              <ul className="flex flex-col gap-2.5 font-sans text-[13px] text-[#F1DDC1]/85">
                <li>Checkout protegido via Square</li>
                <li>Cartões de Crédito e Débito</li>
                <li>Zelle</li>
                <li>Venmo</li>
                <li>Afterpay</li>
              </ul>
            </div>

            <FooterColumn title="Conecte-se" links={socialLinks} />
          </div>

          <p className="mx-auto mt-12 max-w-[620px] text-center font-serif text-[1.15rem] leading-relaxed text-[#F1DDC1]/90">
            Vestindo mulheres com elegância, propósito e feminilidade.
          </p>
        </div>

        <div className="border-t border-white/10 py-5">
          <div className="container-virtuosa flex flex-col items-center justify-between gap-3 text-center sm:flex-row">
            <p className="font-sans text-[11px] text-[#F1DDC1]/70">
              © 2026 Virtuosa USA. Todos os direitos reservados.
            </p>
            <p className="font-sans text-[11px] text-[#F1DDC1]/70">
              Checkout seguro via Square
            </p>
          </div>
        </div>
      </footer>

      <Link
        href="https://wa.me/17742043628"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chamar a Virtuosa no WhatsApp"
        className="fixed bottom-5 right-5 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_28px_rgba(0,0,0,0.24)] transition-transform hover:scale-105"
      >
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M20.5 11.8a8.44 8.44 0 0 1-12.53 7.38L4 20.25l1.12-3.84A8.46 8.46 0 1 1 20.5 11.8Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9.2 7.9c.18-.38.36-.39.53-.39h.45c.14 0 .35.05.53.27.18.22.7.84.7 2.05 0 1.2-.83 2.35-.95 2.52-.12.16-1.62 2.55-3.95 3.47-.55.22-.99.36-1.32.46-.56.18-1.06.15-1.46.09-.45-.07-1.36-.58-1.55-1.15-.19-.56-.19-1.04-.13-1.15.06-.1.21-.17.45-.29.23-.12 1.36-.7 1.57-.78.21-.08.36-.12.51.12.15.23.59.78.72.94.13.16.27.18.5.06.23-.12.98-.38 1.86-1.2.69-.65 1.15-1.45 1.28-1.69.13-.24.01-.37-.1-.49-.1-.11-.23-.29-.35-.43-.12-.15-.15-.25-.23-.42-.08-.16-.04-.31.02-.43.06-.12.5-1.26.7-1.73Z"
            fill="currentColor"
            transform="translate(6.2 1.4) scale(.72)"
          />
        </svg>
      </Link>
    </>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string; external?: boolean }[];
}) {
  return (
    <div>
      <h4 className="mb-4 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F7D98F]">
        {title}
      </h4>
      <ul className="flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={`${title}-${link.label}`}>
            <Link
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className="font-sans text-[13px] text-[#F1DDC1]/85 transition-colors duration-200 hover:text-[#F7D98F]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
