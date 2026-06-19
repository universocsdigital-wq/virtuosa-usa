import Link from "next/link";

const VIP_GROUP_URL = "https://wa.me/c/17742043628";

export function LaunchInvitation() {
  return (
    <section
      id="lancamentos-home"
      aria-labelledby="lancamentos-title"
      className="relative overflow-hidden border-y border-virtuosa-antique-gold/20 bg-virtuosa-warm-beige py-12 lg:py-14"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(90deg, transparent 0%, rgba(198,163,106,0.20) 50%, transparent 100%)",
        }}
      />

      <div className="container-virtuosa relative flex flex-col items-center text-center">
        <div className="max-w-2xl">
          <span className="mb-3 block font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-virtuosa-antique-gold">
            Lançamentos
          </span>
          <h2
            id="lancamentos-title"
            className="font-serif font-normal leading-tight text-virtuosa-deep-brown"
            style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)" }}
          >
            Entre para o Grupo VIP
          </h2>
          <p className="mt-3 font-sans text-[14px] leading-relaxed text-virtuosa-light-brown lg:text-[15px]">
            Receba lançamentos, peças exclusivas e reposições em primeira mão.
          </p>
        </div>

        <Link
          href={VIP_GROUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-7 inline-flex min-h-12 shrink-0 items-center justify-center border border-virtuosa-antique-gold bg-virtuosa-deep-brown px-8 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_8px_20px_rgba(42,23,18,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-virtuosa-antique-gold hover:shadow-[0_11px_26px_rgba(42,23,18,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-virtuosa-antique-gold focus-visible:ring-offset-2"
        >
          Entrar no Grupo VIP {"\u2192"}
        </Link>
      </div>
    </section>
  );
}
