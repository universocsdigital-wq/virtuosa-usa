import "server-only";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";

const ADMIN_COOKIE = "virtuosa-admin-session";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 horas

function getAdminCredentials() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("ADMIN_EMAIL e ADMIN_PASSWORD nao configurados");
  }
  return { email, password };
}

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function validateAdminCredentials(email: string, password: string): boolean {
  try {
    const creds = getAdminCredentials();
    return (
      email.toLowerCase().trim() === creds.email.toLowerCase().trim() &&
      hashPassword(password) === hashPassword(creds.password)
    );
  } catch {
    return false;
  }
}

export function createAdminSessionToken(): string {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.JWT_SECRET || "virtuosa-admin-secret";
  const expires = Date.now() + SESSION_DURATION_MS;
  const payload = `${expires}`;
  const sig = createHash("sha256").update(`${payload}:${secret}`).digest("hex");
  return Buffer.from(JSON.stringify({ expires, sig })).toString("base64url");
}

export function verifyAdminSession(token: string): boolean {
  try {
    const secret = process.env.ADMIN_SESSION_SECRET || process.env.JWT_SECRET || "virtuosa-admin-secret";
    const { expires, sig } = JSON.parse(Buffer.from(token, "base64url").toString());
    if (Date.now() > expires) return false;
    const expected = createHash("sha256").update(`${expires}:${secret}`).digest("hex");
    return sig === expected;
  } catch {
    return false;
  }
}

export async function getAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return verifyAdminSession(token);
}

export { ADMIN_COOKIE, SESSION_DURATION_MS };
