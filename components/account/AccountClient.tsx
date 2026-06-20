"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, LogOut, Package, Truck } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Order {
  id: string;
  square_order_id: string;
  status: string;
  amount_cents: number;
  tracking_number?: string | null;
  carrier?: string | null;
  items?: unknown;
  created_at: string;
}

export function AccountClient() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [step, setStep] = useState<"email" | "code" | "orders">("email");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadOrders = useCallback(async () => {
    const response = await fetch("/api/account/orders", { cache: "no-store" });
    if (response.status === 401) return false;
    const data = (await response.json()) as { email?: string; orders?: Order[]; error?: string };
    if (!response.ok) throw new Error(data.error ?? "Não foi possível consultar seus pedidos.");
    setEmail(data.email ?? "");
    setOrders(data.orders ?? []);
    setStep("orders");
    return true;
  }, []);

  useEffect(() => {
    loadOrders().catch(() => undefined);
  }, [loadOrders]);

  async function requestCode(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/auth/request-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const data = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) return setMessage(data.error ?? "Não foi possível enviar o código.");
    setStep("code");
    setMessage("Enviamos um código para o seu e-mail.");
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/auth/verify-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, token }) });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setLoading(false);
      return setMessage(data.error ?? "Código inválido.");
    }
    try {
      await loadOrders();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível consultar seus pedidos.");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOrders([]);
    setToken("");
    setStep("email");
  }

  if (step === "orders") {
    return (
      <section className="container-virtuosa py-12 lg:py-16">
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#D9C8B5] pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#B88A62]">Minha Conta</p>
            <h1 className="mt-2 font-serif text-4xl text-[#2A1712] sm:text-5xl">Meus Pedidos</h1>
            <p className="mt-2 font-sans text-[13px] text-[#6F5547]">{email}</p>
          </div>
          <button type="button" onClick={logout} className="flex items-center gap-2 self-start font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-[#8A5A36] sm:self-auto"><LogOut size={15} /> Sair</button>
        </div>

        {orders.length === 0 ? (
          <div className="border border-[#D9C8B5] bg-white/55 px-6 py-14 text-center">
            <Package className="mx-auto text-[#B88A62]" size={32} strokeWidth={1.2} />
            <h2 className="mt-5 font-serif text-3xl text-[#2A1712]">Nenhum pedido encontrado</h2>
            <p className="mx-auto mt-3 max-w-md font-sans text-sm leading-relaxed text-[#6F5547]">Use o mesmo e-mail informado no checkout da Square para consultar suas compras.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <article key={order.id} className="border border-[#D9C8B5] bg-white/60 p-5 shadow-[0_8px_24px_rgba(42,23,18,0.06)] sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <p className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[#B88A62]">Pedido {order.square_order_id.slice(-8).toUpperCase()}</p>
                    <p className="mt-2 font-sans text-[13px] text-[#6F5547]">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(order.created_at))}</p>
                  </div>
                  <p className="font-serif text-2xl text-[#2A1712]">{formatPrice(order.amount_cents / 100)}</p>
                </div>
                <div className="mt-5 flex items-center gap-3 border-t border-[#E4D5C3] pt-5">
                  {order.tracking_number ? <Truck size={19} className="text-[#B88A62]" /> : <CheckCircle2 size={19} className="text-[#B88A62]" />}
                  <div>
                    <p className="font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-[#2A1712]">{order.tracking_number ? "Pedido enviado" : "Pedido confirmado"}</p>
                    {order.tracking_number && <p className="mt-1 font-sans text-[12px] text-[#6F5547]">{order.carrier ?? "USPS"}: {order.tracking_number}</p>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="flex min-h-[66vh] items-center justify-center bg-[#F8F3EB] px-6 py-14">
      <div className="w-full max-w-[820px] border border-[#D9C8B5] bg-white/55 p-7 shadow-[0_20px_60px_rgba(42,23,18,0.09)] sm:p-10 lg:px-14">
        <p className="text-center font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#B88A62]">Minha Conta</p>
        <h1 className="mt-3 text-center font-serif text-4xl text-[#2A1712] sm:whitespace-nowrap">Acompanhe seus pedidos</h1>
        <div className="mx-auto mt-4 text-center font-sans text-[13px] leading-relaxed text-[#6F5547]">
          <p className="lg:whitespace-nowrap">Acesse sua área exclusiva para acompanhar seus pedidos e consultar informações de entrega.</p>
          <p className="lg:whitespace-nowrap">Informe o e-mail utilizado na compra e enviaremos um código de acesso para você.</p>
        </div>

        {step === "email" ? (
          <form onSubmit={requestCode} className="mx-auto mt-7 max-w-[440px]">
            <label htmlFor="account-email" className="mb-2 block font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[#4F3527]">Seu e-mail</label>
            <input id="account-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 w-full border border-[#CDB89F] bg-[#FFFDF8] px-4 font-sans text-sm text-[#2A1712] outline-none focus:border-[#8A5A36]" autoComplete="email" />
            <button type="submit" disabled={loading} className="mx-auto mt-3 flex min-h-11 w-full max-w-[320px] items-center justify-center bg-[#8A5A36] px-6 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_7px_18px_rgba(42,23,18,0.14)] disabled:opacity-60">{loading ? "Enviando..." : "Receber código \u2192"}</button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="mx-auto mt-7 max-w-[440px]">
            <label htmlFor="account-code" className="mb-2 block font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[#4F3527]">Código recebido</label>
            <input id="account-code" inputMode="numeric" pattern="[0-9]*" required value={token} onChange={(event) => setToken(event.target.value.replace(/\D/g, "").slice(0, 8))} className="h-11 w-full border border-[#CDB89F] bg-[#FFFDF8] px-4 text-center font-sans text-xl tracking-[0.35em] text-[#2A1712] outline-none focus:border-[#8A5A36]" autoComplete="one-time-code" />
            <button type="submit" disabled={loading} className="mx-auto mt-3 flex min-h-11 w-full max-w-[320px] items-center justify-center bg-[#8A5A36] px-6 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_7px_18px_rgba(42,23,18,0.14)] disabled:opacity-60">{loading ? "Entrando..." : "Consultar pedidos \u2192"}</button>
            <button type="button" onClick={() => setStep("email")} className="mt-4 w-full font-sans text-[11px] text-[#8A5A36] underline underline-offset-4">Usar outro e-mail</button>
          </form>
        )}

        {message && <p className="mt-4 text-center font-sans text-[12px] leading-relaxed text-[#6F5547]">{message}</p>}
      </div>
    </section>
  );
}
