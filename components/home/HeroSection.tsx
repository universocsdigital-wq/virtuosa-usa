import Image from "next/image";
import Link from "next/link";

export function HeroSection() {
  return (
    <section id="hero" aria-label="Virtuosa USA" className="relative w-full overflow-hidden" style={{ backgroundColor: "#170B07" }}>
      <div className="grid min-h-[660px] lg:min-h-[610px] lg:grid-cols-[43%_57%]">
        <div className="relative flex items-center px-6 py-14 sm:px-10 lg:px-16 xl:px-20">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 10% 50%, rgba(198,163,106,0.13), transparent 44%), linear-gradient(90deg, rgba(23,11,7,1), rgba(23,11,7,0.92))",
            }}
            aria-hidden
          />

          <div className="absolute left-[-120px] top-1/2 h-[420px] w-[420px] -translate-y-1/2 opacity-[0.095] lg:h-[520px] lg:w-[520px]" aria-hidden>
            <Image src="/svg/MONOGRAMA/Monograma sem Circulo Fundo Branco.svg" alt="" fill className="object-contain" />
          </div>

          <div className="relative z-10 max-w-[540px]">
            <h1
              className="text-balance font-serif text-white"
              style={{
                fontSize: "clamp(3.05rem, 5.35vw, 5rem)",
                lineHeight: 0.98,
                letterSpacing: "-0.025em",
              }}
            >
              Elegância com Propósito
            </h1>

            <p
              className="mt-8 max-w-[410px] font-sans uppercase leading-relaxed"
              style={{ color: "rgba(247,241,232,0.9)", fontSize: "12px", letterSpacing: "0.17em" }}
            >
              Peças selecionadas para mulheres
              <br />
              que vestem com intenção.
            </p>

            <div className="mt-8 flex flex-col gap-3.5 sm:flex-row">
              <Link href="/shop" className="btn-hero-primary min-w-[246px] whitespace-nowrap px-7 text-[12px]">
                CONHEÇA A COLEÇÃO {"\u2192"}
              </Link>
              <Link href="#manifesto" className="btn-hero-secondary min-w-[206px] whitespace-nowrap px-7 text-[12px]">
                Sobre a Marca {"\u2192"}
              </Link>
            </div>
          </div>
        </div>

        <div className="relative min-h-[540px] overflow-hidden bg-[#170B07] lg:min-h-full">
          <Image
            src="/images/hero/hero-virtuosa-final.png"
            alt="Vestido branco elegante em atmosfera editorial Virtuosa"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 52vw"
            className="object-cover object-[50%_0%]"
            quality={92}
          />
          <div className="absolute inset-0 texture-linen opacity-20" aria-hidden />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(23,11,7,0.82) 0%, rgba(23,11,7,0.30) 24%, transparent 58%), linear-gradient(180deg, rgba(23,11,7,0.02) 0%, rgba(23,11,7,0.18) 100%)",
            }}
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}
