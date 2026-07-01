import "server-only";

function requiredEnv(name: "SUPABASE_URL" | "SUPABASE_ANON_KEY" | "SUPABASE_SERVICE_ROLE_KEY") {
  const value = process.env[name];
  if (!value) throw new Error(`${name} não configurada`);
  return value;
}

export function supabaseConfig() {
  return {
    url: requiredEnv("SUPABASE_URL"),
    anonKey: requiredEnv("SUPABASE_ANON_KEY"),
    serviceRoleKey: requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

export async function getSupabaseUser(accessToken: string) {
  const { url, anonKey } = supabaseConfig();
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) return null;
  return (await response.json()) as { id: string; email?: string };
}

export async function revokeSupabaseSession(accessToken: string) {
  const { url, anonKey } = supabaseConfig();
  await fetch(`${url}/auth/v1/logout`, {
    method: "POST",
    headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
}

export async function ensureSupabaseUser(email: string) {
  if (!email) return;
  const { url, serviceRoleKey } = supabaseConfig();
  const response = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, email_confirm: true }),
    cache: "no-store",
  });

  // O Supabase retorna 422 quando o usuário já existe.
  if (!response.ok && response.status !== 422) {
    throw new Error(`Falha ao preparar acesso do cliente: ${response.status}`);
  }
}

export async function upsertSupabaseOrder(order: Record<string, unknown>) {
  const { url, serviceRoleKey } = supabaseConfig();
  const response = await fetch(`${url}/rest/v1/orders?on_conflict=square_order_id`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(order),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Falha ao registrar pedido: ${response.status}`);
}
