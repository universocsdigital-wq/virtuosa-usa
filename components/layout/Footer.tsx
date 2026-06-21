import Link from "next/link";

const curationLinks = [
  { label: "Coleção", href: "/shop#lancamentos" },
  { label: "Mais Amadas", href: "/#best-sellers" },
  { label: "Nossa Essência", href: "/#manifesto" },
];

const aboutLinks = [
  { label: "O Coração por Trás da Virtuosa", href: "/#elaine-soares" },
  { label: "Depoimentos", href: "/#reviews" },
  { label: "Envios e Trocas", href: "/entregas-e-trocas" },
];

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/virtuosa.usa/", external: true },
  { label: "Grupo VIP", href: "https://chat.whatsapp.com/BYkfi3grimA4RvQspUTVFL", external: true },
];

export function Footer() {
  return (
    <>
      <footer className="relative overflow-hidden" style={{ backgroundColor: "#4F2107" }} aria-label="Rodapé">
        <div className="absolute inset-0 texture-linen opacity-30" aria-hidden />
        <div className="absolute bottom-[-8%] right-[4%] h-[360px] w-[360px] opacity-[0.055] lg:h-[480px] lg:w-[480px]" aria-hidden>
          <img src="/svg/MONOGRAMA/Monograma sem Circulo Fundo Branco.svg" alt="" className="h-full w-full object-contain" />
        </div>

        <div className="container-virtuosa relative py-5 lg:py-14">
          <div className="grid grid-cols-2 items-start gap-x-6 gap-y-6 md:grid-cols-2 xl:grid-cols-[1.28fr_1fr_1.15fr_1.25fr_0.95fr] xl:gap-12">
            <div className="hidden xl:col-span-1 xl:block">
              <Link href="/" className="brand-logo-reference brand-logo-reference--footer relative block h-[58px] w-[190px] overflow-visible xl:mb-5 xl:h-[82px] xl:w-[240px]" aria-label="Virtuosa USA" />
            </div>

            <FooterColumn title="Explore" links={curationLinks} />
            <FooterColumn title="Sobre" links={aboutLinks} />

            <div className="min-w-0 pt-1 xl:pt-0">
              <h4 className="mb-2.5 font-sans text-[8.5px] font-semibold uppercase tracking-[0.12em] text-[#F7D98F] sm:text-[10px]">
                Compra Segura
              </h4>
              <ul className="grid gap-1.5 font-sans text-[10px] leading-snug text-[#F1DDC1]/90 sm:text-[13px]">
                <li>Checkout protegido via Square</li>
                <li>Cartões de Crédito e Débito</li>
                <li>Apple Pay</li>
                <li>Google Pay</li>
                <li>Cash App Pay</li>
              </ul>
            </div>

            <FooterColumn title="Conecte-se" links={socialLinks} />
          </div>

          <p className="mx-auto mt-7 max-w-[620px] text-center font-serif text-[0.92rem] leading-relaxed text-[#F1DDC1]/90 lg:mt-12 lg:text-[1.15rem]">
            Vestindo mulheres com elegância, propósito e feminilidade.
          </p>
        </div>

        <div className="border-t border-white/10 py-3.5 lg:py-5">
          <div className="container-virtuosa flex flex-col items-center justify-between gap-3 text-center sm:flex-row">
            <p className="font-sans text-[9.5px] text-[#F1DDC1]/75 sm:text-[11px]">
              © 2026 Virtuosa USA. Todos os direitos reservados.
            </p>
            <p className="hidden font-sans text-[11px] text-[#F1DDC1]/70 sm:block">
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
        className="fixed bottom-4 right-4 z-[90] flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_28px_rgba(0,0,0,0.24)] transition-transform hover:scale-105 sm:bottom-5 sm:right-5 sm:h-14 sm:w-14"
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
    <div className="min-w-0 pt-1 xl:pt-0">
      <h4 className="mb-2.5 font-sans text-[8.5px] font-semibold uppercase tracking-[0.12em] text-[#F7D98F] sm:text-[10px]">
        {title}
      </h4>
      <ul className="flex flex-col gap-1.5 sm:gap-2">
        {links.map((link) => (
          <li key={`${title}-${link.label}`}>
            <Link
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className="font-sans text-[10px] leading-snug text-[#F1DDC1]/90 transition-colors duration-200 hover:text-[#F7D98F] sm:text-[13px] sm:leading-relaxed"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
