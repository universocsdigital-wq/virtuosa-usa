import type { ReactNode } from "react";

const trustItems = [
  {
    id: "elegancia",
    icon: <DressIcon />,
    title: "Elegância Atemporal",
    description: <>Peças para mulheres que<br />valorizam beleza e presença.</>,
  },
  {
    id: "atendimento",
    icon: <FlowerIcon />,
    title: "Atendimento Personalizado",
    description: <>Suporte dedicado em cada<br />etapa da sua compra.</>,
  },
  {
    id: "entrega",
    icon: <DeliveryIcon />,
    title: "Entrega nos EUA",
    description: <>Envio rápido e seguro para<br />todo o território americano.</>,
  },
  {
    id: "seguranca",
    icon: <LockIcon />,
    title: "Compra Segura",
    description: <>Checkout protegido e<br />pagamentos seguros.</>,
  },
];

export function TrustBar() {
  return (
    <section id="trust-bar" aria-label="Por que escolher a Virtuosa" className="bg-virtuosa-champagne">
      <div className="container-virtuosa py-6 lg:py-7">
        <div className="grid grid-cols-2 gap-y-6 lg:grid-cols-4 lg:gap-y-0">
          {trustItems.map((item) => (
            <div
              key={item.id}
              className="relative flex flex-col items-center px-3 text-center lg:border-r lg:border-[#B38A62]/20 lg:px-4 lg:last:border-r-0"
            >
              <span className="mb-3 flex h-9 w-9 items-center justify-center text-virtuosa-camel" aria-hidden>
                {item.icon}
              </span>
              <h3 className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-[0.13em] text-virtuosa-deep-brown">
                {item.title}
              </h3>
              <p className="mx-auto max-w-[190px] font-sans text-[12px] leading-relaxed text-virtuosa-light-brown">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function IconFrame({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="h-9 w-9">
      {children}
    </svg>
  );
}

function DressIcon() {
  return (
    <IconFrame>
      <path d="M24 7c-3 4-6 7-10 8 2.2 4 3.1 8.6 2.5 13.8L14 41h20l-2.5-12.2c-.6-5.2.3-9.8 2.5-13.8-4-1-7-4-10-8Z" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" />
      <path d="M19 15c1.5 1.2 3.1 1.8 5 1.8s3.5-.6 5-1.8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </IconFrame>
  );
}

function FlowerIcon() {
  return (
    <IconFrame>
      <circle cx="24" cy="24" r="4.2" stroke="currentColor" strokeWidth="1.25" />
      <path d="M24 9c4 4 4 7.5 0 11.2C20 16.5 20 13 24 9Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      <path d="M24 39c-4-4-4-7.5 0-11.2C28 31.5 28 35 24 39Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      <path d="M9 24c4-4 7.5-4 11.2 0C16.5 28 13 28 9 24Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      <path d="M39 24c-4 4-7.5 4-11.2 0C31.5 20 35 20 39 24Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
    </IconFrame>
  );
}

function DeliveryIcon() {
  return (
    <IconFrame>
      <path d="M7 17h24v17H7V17Z" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" />
      <path d="M31 22h6l4 5v7H31" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" />
      <path d="M12 34a3 3 0 1 0 6 0M32 34a3 3 0 1 0 6 0" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
      <path d="M13 22h9M13 27h13" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </IconFrame>
  );
}

function LockIcon() {
  return (
    <IconFrame>
      <rect x="12" y="21" width="24" height="19" rx="2" stroke="currentColor" strokeWidth="1.35" />
      <path d="M18 21v-5a6 6 0 0 1 12 0v5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
      <path d="M24 29v5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
    </IconFrame>
  );
}
