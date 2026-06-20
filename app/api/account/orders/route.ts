import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabaseUser, supabaseConfig } from "@/lib/supabase.server";

export async function GET() {
  const accessToken = (await cookies()).get("virtuosa-session")?.value;
  if (!accessToken) return NextResponse.json({ error: "Não autenticada." }, { status: 401 });

  try {
    const user = await getSupabaseUser(accessToken);
    if (!user?.email) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

    const { url, serviceRoleKey } = supabaseConfig();
    const query = new URLSearchParams({
      customer_email: `eq.${user.email.toLowerCase()}`,
      select: "id,square_order_id,status,amount_cents,tracking_number,carrier,items,created_at",
      order: "created_at.desc",
    });
    const response = await fetch(`${url}/rest/v1/orders?${query}`, {
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Falha ao consultar pedidos.");
    return NextResponse.json({ email: user.email, orders: await response.json() });
  } catch {
    return NextResponse.json({ error: "Não foi possível consultar os pedidos." }, { status: 503 });
  }
}
