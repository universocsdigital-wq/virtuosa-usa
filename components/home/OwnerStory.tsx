export function OwnerStory() {
  return (
    <section
      id="elaine-soares"
      aria-label="O coração por trás da Virtuosa"
      className="section-warm texture-linen relative overflow-hidden bg-[#EDE1D2] pb-[54px] pt-[20px] lg:pb-[64px] lg:pt-[24px]"
    >
      <div className="container-virtuosa">
        <div className="grid items-center gap-10 border-t border-[#D9C8B5] pt-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[360px] overflow-hidden border border-[#C6A36A]/35 bg-[#F7F1E8] shadow-[0_24px_70px_rgba(42,23,18,0.10)]">
            <div className="absolute inset-5 border border-[#C6A36A]/22" aria-hidden />
            <div className="absolute inset-0 texture-linen opacity-70" aria-hidden />
            <div
              className="absolute inset-0 opacity-[0.075]"
              style={{
                backgroundImage: "url('/svg/MONOGRAMA/Monograma sem Circulo Fundo Claro.svg.svg')",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "52%",
              }}
              aria-hidden
            />
            <div className="absolute bottom-8 left-1/2 h-px w-24 -translate-x-1/2 bg-[#C6A36A]/45" aria-hidden />
          </div>

          <div className="mx-auto max-w-[700px] text-center lg:text-left">
            <span className="mb-4 block font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-virtuosa-antique-gold">
              O coração por trás da Virtuosa
            </span>
            <h2
              className="font-serif text-virtuosa-deep-brown"
              style={{ fontSize: "clamp(2rem, 3.8vw, 3.15rem)", lineHeight: 1.08 }}
            >
              Elaine Soares
            </h2>

            <div className="mt-6 space-y-4 font-sans text-virtuosa-light-brown" style={{ fontSize: "0.98rem", lineHeight: 1.82 }}>
              <p>
                Empresária, mulher de fé, esposa, mãe e brasileira vivendo nos Estados Unidos, Elaine conhece de perto os desafios e recomeços que fazem parte da jornada de tantas mulheres que construíram uma nova vida longe de casa.
              </p>
              <p>
                Foi dessa vivência que nasceu a Virtuosa USA: uma boutique criada por uma mulher que entende outras mulheres.
              </p>
              <p>
                Cada peça é escolhida com intenção e propósito, pensando na mulher que deseja se vestir com elegância, feminilidade e autenticidade, sem abrir mão de seus valores.
              </p>
              <p>
                Porque a verdadeira elegância não está apenas no que vestimos, mas na forma como expressamos quem somos.
              </p>
              <p className="pt-2 font-serif text-[1.25rem] leading-relaxed text-virtuosa-deep-brown">
                Bem-vinda à Virtuosa.
                <br />
                Um espaço criado para mulheres que desejam vestir sua essência.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
