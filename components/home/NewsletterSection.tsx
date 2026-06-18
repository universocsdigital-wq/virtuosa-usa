import Link from "next/link";

export function NewsletterSection() {
  return (
    <section
      id="newsletter"
      aria-label="Universo Virtuosa"
      className="relative overflow-hidden py-16 lg:py-20"
      style={{ backgroundColor: "#24110B" }}
    >
      <div className="absolute inset-0 texture-linen opacity-42" aria-hidden />
      <div className="absolute left-[-7%] top-1/2 h-[360px] w-[360px] -translate-y-1/2 opacity-[0.065] lg:h-[460px] lg:w-[460px]" aria-hidden>
        <img src="/svg/MONOGRAMA/Monograma sem Circulo Fundo Branco.svg" alt="" className="h-full w-full object-contain" />
      </div>
      <div className="absolute right-[-4%] top-[12%] h-[220px] w-[220px] opacity-[0.045] lg:h-[300px] lg:w-[300px]" aria-hidden>
        <img src="/svg/MONOGRAMA/Monograma sem Circulo Fundo Branco.svg" alt="" className="h-full w-full object-contain" />
      </div>

      <div className="container-virtuosa relative">
        <div className="mx-auto max-w-3xl text-center">
          <Link
            href="https://wa.me/c/17742043628"
            target="_blank"
            rel="noopener noreferrer"
            className="brand-logo-reference brand-logo-reference--footer relative mx-auto mb-6 block h-[76px] w-[230px] overflow-visible opacity-100 transition-transform hover:-translate-y-0.5"
            aria-label="Entrar no Universo Virtuosa"
          />

          <h2 className="font-serif leading-tight text-white" style={{ fontSize: "clamp(2.65rem, 5vw, 4.2rem)" }}>
            Entre para o
            <br />
            Universo Virtuosa
          </h2>

          <p className="mx-auto mt-6 max-w-[720px] font-sans leading-relaxed" style={{ color: "rgba(247,241,232,0.9)", fontSize: "1rem" }}>
            Receba novas coleções, peças selecionadas e conteúdos pensados para mulheres que valorizam elegância, feminilidade e propósito. Um espaço reservado para quem deseja descobrir nossas novidades em primeira mão.
          </p>

          <p className="mx-auto mt-5 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C6A36A]">
            ↓ toque para entrar
          </p>

          <div className="mt-5 flex justify-center">
            <Link
              href="https://wa.me/c/17742043628"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[52px] items-center justify-center border border-[#F1DDC1] bg-[#F1DDC1] px-9 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-[#4F2107] transition-colors hover:border-[#F5D58A] hover:bg-[#F5D58A]"
            >
              SOLICITAR ACESSO →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
