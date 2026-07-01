import "server-only";

import { createHash } from "node:crypto";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  namespace: string;
  identifier: string;
  limit: number;
  windowMs: number;
}

const globalStore = globalThis as typeof globalThis & {
  __virtuosaRateLimits?: Map<string, RateLimitEntry>;
};

const store = globalStore.__virtuosaRateLimits ?? new Map<string, RateLimitEntry>();
globalStore.__virtuosaRateLimits = store;

export function getClientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "unknown";
}

export function rateLimit({ namespace, identifier, limit, windowMs }: RateLimitOptions) {
  const now = Date.now();
  const digest = createHash("sha256").update(identifier).digest("hex");
  const key = `${namespace}:${digest}`;
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    cleanup(now);
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }

  current.count += 1;
  return { allowed: true, remaining: limit - current.count, retryAfter: 0 };
}

export async function durableRateLimit(options: RateLimitOptions) {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return rateLimit(options);

  const digest = createHash("sha256").update(`${options.namespace}:${options.identifier}`).digest("hex");
  try {
    const response = await fetch(`${url}/rest/v1/rpc/consume_api_rate_limit`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_key: digest,
        p_limit: options.limit,
        p_window_seconds: Math.ceil(options.windowMs / 1000),
      }),
      cache: "no-store",
    });
    if (!response.ok) return rateLimit(options);
    const rows = (await response.json()) as Array<{ allowed?: boolean; retry_after?: number }>;
    const result = rows[0];
    if (!result || typeof result.allowed !== "boolean") return rateLimit(options);
    return {
      allowed: result.allowed,
      remaining: result.allowed ? 1 : 0,
      retryAfter: Number(result.retry_after ?? 0),
    };
  } catch {
    return rateLimit(options);
  }
}

function cleanup(now: number) {
  if (store.size < 2_000) return;
  for (const [key, value] of store) {
    if (value.resetAt <= now) store.delete(key);
  }
}
