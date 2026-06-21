export function OwnerStory() {
  return (
    <section
      id="elaine-soares"
      aria-label="O coração por trás da Virtuosa"
      className="section-warm texture-linen relative overflow-hidden bg-[#EDE1D2] py-9 lg:pb-[64px] lg:pt-[24px]"
    >
      <div className="container-virtuosa">
        <div className="grid items-center gap-7 border-t border-[#D9C8B5] pt-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:pt-10">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[230px] overflow-hidden border border-[#C6A36A]/35 bg-[#F7F1E8] shadow-[0_18px_48px_rgba(42,23,18,0.08)] lg:max-w-[360px] lg:shadow-[0_24px_70px_rgba(42,23,18,0.10)]">
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

          <div className="mx-auto w-full max-w-[700px] text-center lg:text-left">
            <span className="mb-3 block font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-virtuosa-antique-gold lg:mb-4 lg:text-[10px] lg:tracking-[0.22em]">
              O coração por trás da Virtuosa
            </span>
            <h2 className="font-serif text-[2.2rem] leading-none text-virtuosa-deep-brown lg:text-[3.15rem] lg:leading-[1.08]">
              Elaine Soares
            </h2>

            <div className="mx-auto mt-5 max-w-[350px] space-y-3 text-left font-sans text-[0.82rem] leading-[1.58] text-virtuosa-light-brown lg:hidden">
              <p>
                Empresária, mulher de fé, esposa, mãe e brasileira nos EUA, Elaine conhece os desafios de recomeçar longe de casa.
              </p>
              <p>
                Dessa vivência nasceu a Virtuosa USA, uma boutique que escolhe cada peça com intenção e respeito aos valores de cada mulher.
              </p>
              <p className="pt-2 text-center font-serif text-[1rem] leading-relaxed text-virtuosa-deep-brown">
                Bem-vinda à Virtuosa.<br />Um espaço para vestir sua essência.
              </p>
            </div>

            <div className="mt-6 hidden space-y-4 font-sans text-[0.98rem] leading-[1.82] text-virtuosa-light-brown lg:block">
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
                Bem-vinda à Virtuosa.<br />Um espaço criado para mulheres que desejam vestir sua essência.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
