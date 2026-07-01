import { NextResponse } from "next/server";
import { durableRateLimit, getClientIp } from "@/lib/rate-limit";
import { supabaseConfig } from "@/lib/supabase.server";

const WINDOW_MS = 15 * 60 * 1000;

function tooManyRequests(retryAfter: number) {
  return NextResponse.json(
    { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

export async function POST(request: Request) {
  let email = "";
  try {
    email = String(((await request.json()) as { email?: string }).email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  }

  const ipLimit = await durableRateLimit({ namespace: "otp-request-ip", identifier: getClientIp(request), limit: 10, windowMs: WINDOW_MS });
  if (!ipLimit.allowed) return tooManyRequests(ipLimit.retryAfter);

  const emailLimit = await durableRateLimit({ namespace: "otp-request-email", identifier: email, limit: 3, windowMs: WINDOW_MS });
  if (!emailLimit.allowed) return tooManyRequests(emailLimit.retryAfter);

  try {
    const { url, anonKey } = supabaseConfig();
    const response = await fetch(`${url}/auth/v1/otp`, {
      method: "POST",
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, create_user: false }),
      cache: "no-store",
    });

    // A resposta permanece genérica para não revelar quais e-mails possuem conta.
    if (response.status >= 500) {
      return NextResponse.json({ error: "Não foi possível enviar o código. Tente novamente." }, { status: 502 });
    }
    return NextResponse.json({ sent: true });
  } catch {
    return NextResponse.json({ error: "O acesso por código ainda está sendo configurado." }, { status: 503 });
  }
}
