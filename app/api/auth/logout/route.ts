import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { revokeSupabaseSession } from "@/lib/supabase.server";

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("virtuosa-session")?.value;

  if (accessToken) {
    try {
      await revokeSupabaseSession(accessToken);
    } catch (error) {
      console.error("[Auth logout] Não foi possível revogar a sessão no Supabase.", error);
    }
  }

  const response = NextResponse.json({ loggedOut: true });
  response.cookies.set("virtuosa-session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
