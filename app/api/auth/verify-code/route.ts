import { NextResponse } from "next/server";
import { supabaseConfig } from "@/lib/supabase.server";

export async function POST(request: Request) {
  let body: { email?: string; token?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Código inválido." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const token = String(body.token ?? "").trim();
  if (!email || !/^\d{6,8}$/.test(token)) return NextResponse.json({ error: "Informe o código recebido no e-mail." }, { status: 400 });

  try {
    const { url, anonKey } = supabaseConfig();
    const response = await fetch(`${url}/auth/v1/verify`, {
      method: "POST",
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, type: "email" }),
      cache: "no-store",
    });
    const data = (await response.json()) as { access_token?: string; expires_in?: number };
    if (!response.ok || !data.access_token) return NextResponse.json({ error: "Código inválido ou expirado." }, { status: 401 });

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
