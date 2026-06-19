import Image from "next/image";
import Link from "next/link";

export function ManifestoSection() {
  return (
    <section id="manifesto" aria-label="A Mulher Virtuosa" className="section-warm texture-linen relative overflow-hidden bg-[#F8F3EB] py-18 lg:py-24">
      <div className="absolute right-[-10%] top-1/2 h-[560px] w-[560px] -translate-y-1/2 opacity-[0.038] lg:h-[680px] lg:w-[680px]" aria-hidden>
        <Image src="/svg/MONOGRAMA/Monograma sem circulo fundo marrom.svg" alt="" fill className="object-contain" />
      </div>

      <div className="container-virtuosa relative">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[44%_56%] lg:gap-16">
          <div className="relative">
            <div className="absolute -left-5 -top-5 bottom-5 right-5 border border-virtuosa-antique-gold/22" aria-hidden />
            <div className="relative aspect-[4/5] overflow-hidden bg-[#2A1712] shadow-[0_28px_80px_rgba(42,23,18,0.18)]">
              <Image
                src="/images/manifesto/mulher-virtuosa.jpg"
                alt="Mulher elegante em tons neutros representando a essência Virtuosa"
                fill
                sizes="(max-width: 1024px) 100vw, 44vw"
                className="object-cover object-[center_18%]"
                quality={92}
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(42,23,18,0.03) 0%, rgba(42,23,18,0.12) 100%)",
                }}
                aria-hidden
              />
            </div>
          </div>

          <div className="relative flex flex-col items-start lg:pl-4">
            <span className="mb-5 font-sans text-[10px] font-medium uppercase tracking-[0.24em] text-virtuosa-antique-gold">
              Nossa Essência
            </span>

            <h2
              className="mb-7 font-serif text-virtuosa-deep-brown"
              style={{ fontSize: "clamp(2.25rem, 4.5vw, 3.35rem)", lineHeight: 1.05, letterSpacing: "-0.01em" }}
            >
              A Mulher<br />Virtuosa
            </h2>

            <div className="max-w-[560px] space-y-4 font-sans leading-relaxed text-virtuosa-light-brown" style={{ fontSize: "0.96rem", lineHeight: 1.82 }}>
              <p>
                A Virtuosa nasceu para mulheres que desejam se vestir com intenção, sem abrir mão dos valores que fazem parte de quem são.
              </p>
              <p>
                A Mulher Virtuosa valoriza sua fé, sua família e a forma como se apresenta ao mundo. Ela encontra beleza nos detalhes, força na delicadeza e confiança em permanecer fiel à sua essência.
              </p>
              <p>
                Entre a rotina, os compromissos e os diferentes papéis que desempenha todos os dias, ela escolhe peças que acompanham sua jornada e refletem quem ela é.
              </p>
            </div>

            <p className="mb-3 mt-8 font-serif italic text-virtuosa-deep-brown" style={{ fontSize: "1.05rem", lineHeight: 1.65 }}>
              Conheça a seleção que traduz essa essência.
            </p>

            <Link
              href="#colecao"
              className="inline-flex min-h-12 items-center justify-center border border-virtuosa-antique-gold bg-virtuosa-cream px-7 font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-virtuosa-deep-brown shadow-[0_7px_18px_rgba(92,61,46,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-virtuosa-antique-gold hover:text-white hover:shadow-[0_10px_24px_rgba(92,61,46,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-virtuosa-antique-gold focus-visible:ring-offset-2"
            >
              VISTA SUA ESSÊNCIA {"\u2192"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
