import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Token do Square nao configurado." }, { status: 500 });
  }

  const baseUrl = process.env.SQUARE_ENVIRONMENT === "sandbox"
    ? "https://connect.squareupsandbox.com"
    : "https://connect.squareup.com";

  try {
    const response = await fetch(`${baseUrl}/v2/online-checkout/merchant-settings`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Square-Version": process.env.SQUARE_API_VERSION ?? "2026-05-20",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { error: data.errors?.[0]?.detail ?? "Nao foi possivel consultar as formas de pagamento." },
        { status: response.status }
      );
    }

    const methods = data.merchant_settings?.payment_methods ?? {};
    return NextResponse.json({
      applePay: methods.apple_pay ?? null,
      googlePay: methods.google_pay ?? null,
      cashAppPay: methods.cash_app_pay ?? methods.cash_app ?? null,
      afterpay: methods.afterpay_clearpay ?? null,
      updatedAt: data.merchant_settings?.updated_at ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Nao foi possivel consultar as formas de pagamento." }, { status: 502 });
  }
}
