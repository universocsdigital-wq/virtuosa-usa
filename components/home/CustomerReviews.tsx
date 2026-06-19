import Image from "next/image";
import type { Review } from "@/types";

interface CustomerReviewsProps {
  reviews: Review[];
  aggregate: { score: number; total: number };
}

export function CustomerReviews({ reviews }: CustomerReviewsProps) {
  return (
    <section
      id="reviews"
      aria-label="Depoimentos das clientes"
      className="relative overflow-hidden bg-virtuosa-warm-beige pb-[26px] pt-[38px] lg:pb-[32px] lg:pt-[46px]"
    >
      <div
        className="pointer-events-none absolute right-[-3%] top-1/2 -translate-y-1/2"
        style={{ width: "min(360px, 42vw)", height: "min(360px, 42vw)", opacity: 0.03 }}
        aria-hidden
      >
        <Image
          src="/svg/MONOGRAMA/Monograma sem Circulo Fundo Claro.svg.svg"
          alt=""
          fill
          className="object-contain"
        />
      </div>

      <div className="container-virtuosa">
        <div className="mb-7 text-center lg:mb-9">
          <span className="section-subtitle">Virtuosas</span>
          <h2 className="section-title">Palavras Delas</h2>
          <span className="gold-divider" />
          <p className="mx-auto mt-4 max-w-xl font-sans text-[13px] leading-relaxed text-virtuosa-light-brown">
            Histórias reais compartilhadas por mulheres
            <br />
            que já receberam a experiência Virtuosa.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <article
      className="relative bg-virtuosa-cream p-6 lg:p-7"
      style={{ borderRadius: "2px" }}
      aria-label={`Depoimento de ${review.author}`}
    >
      <div
        className="pointer-events-none absolute left-7 top-5 select-none font-serif leading-none"
        style={{
          fontSize: "68px",
          color: "rgba(198,163,106,0.13)",
          lineHeight: 1,
          fontStyle: "italic",
        }}
        aria-hidden
      >
        &ldquo;
      </div>

      <div className="relative">
        <blockquote
          className="mb-5 font-serif italic leading-relaxed text-virtuosa-deep-brown"
          style={{ fontSize: "0.98rem", lineHeight: "1.62" }}
        >
          {review.text}
        </blockquote>

        <div
          className="mb-4 h-px w-8"
          style={{ backgroundColor: "rgba(198,163,106,0.38)" }}
          aria-hidden
        />

        <footer className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(198,163,106,0.15)" }}
            aria-hidden
          >
            <span className="font-serif font-normal text-virtuosa-antique-gold" style={{ fontSize: "14px" }}>
              {review.author.charAt(0)}
            </span>
          </div>

          <div>
            <p
              className="font-sans font-medium uppercase text-virtuosa-deep-brown"
              style={{ fontSize: "11px", letterSpacing: "0.12em" }}
            >
              {review.author}
            </p>
            {review.verified && (
              <p
                className="mt-0.5 font-sans text-virtuosa-antique-gold"
                style={{ fontSize: "10px", letterSpacing: "0.08em" }}
              >
                Cliente Virtuosa
              </p>
            )}
          </div>
        </footer>
      </div>
    </article>
  );
}
