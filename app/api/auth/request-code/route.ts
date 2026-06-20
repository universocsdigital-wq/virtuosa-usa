import { NextResponse } from "next/server";
import { supabaseConfig } from "@/lib/supabase.server";

export async function POST(request: Request) {
  let email = "";
  try {
    email = String(((await request.json()) as { email?: string }).email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  }

  try {
    const { url, anonKey } = supabaseConfig();
    const response = await fetch(`${url}/auth/v1/otp`, {
      method: "POST",
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, create_user: true }),
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.json({ error: "Não foi possível enviar o código. Tente novamente." }, { status: 502 });
    return NextResponse.json({ sent: true });
  } catch {
    return NextResponse.json({ error: "O acesso por código ainda está sendo configurado." }, { status: 503 });
  }
}
