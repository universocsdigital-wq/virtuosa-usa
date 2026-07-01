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
  let body: { email?: string; token?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Código inválido." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const token = String(body.token ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(token)) {
    return NextResponse.json({ error: "Informe o código de 6 dígitos recebido no e-mail." }, { status: 400 });
  }

  const ipLimit = await durableRateLimit({ namespace: "otp-verify-ip", identifier: getClientIp(request), limit: 20, windowMs: WINDOW_MS });
  if (!ipLimit.allowed) return tooManyRequests(ipLimit.retryAfter);

  const emailLimit = await durableRateLimit({ namespace: "otp-verify-email", identifier: email, limit: 5, windowMs: WINDOW_MS });
  if (!emailLimit.allowed) return tooManyRequests(emailLimit.retryAfter);

  try {
    const { url, anonKey } = supabaseConfig();
    const response = await fetch(`${url}/auth/v1/verify`, {
      method: "POST",
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, type: "email" }),
      cache: "no-store",
    });
    const data = (await response.json()) as { access_token?: string; expires_in?: number };
    if (!response.ok || !data.access_token) {
      return NextResponse.json({ error: "Código inválido ou expirado." }, { status: 401 });
    }

    const result = NextResponse.json({ authenticated: true });
    result.cookies.set("virtuosa-session", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: data.expires_in ?? 3600,
    });
    return result;
  } catch {
    return NextResponse.json({ error: "O acesso por código ainda está sendo configurado." }, { status: 503 });
  }
}
