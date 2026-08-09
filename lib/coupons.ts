export type CouponKind = "free_shipping" | "fixed_amount" | "percentage";

export interface CouponDefinition {
  code: string;
  kind: CouponKind;
  amountCents: number;
  percentage?: number;
  label: string;
  validFrom?: string;
  validUntil?: string;
}

export interface CouponValidation {
  valid: boolean;
  coupon?: CouponDefinition;
  error?: string;
}

const COUPONS: CouponDefinition[] = [
  {
    code: "20OFF",
    kind: "percentage",
    amountCents: 0,
    percentage: 20,
    label: "20% de desconto",
    validFrom: "2026-08-09T00:00:00-04:00",
    validUntil: "2026-09-08T23:59:59-04:00",
  },
  {
    code: "FRETEGRATIS",
    kind: "free_shipping",
    amountCents: 0,
    label: "Frete gratis",
    validFrom: "2026-07-15T00:00:00-04:00",
    validUntil: "2026-07-15T23:59:59-04:00",
  },
  {
    code: "VIRTUOSA20",
    kind: "fixed_amount",
    amountCents: 2000,
    label: "US$ 20 de desconto",
  },
  {
    code: "VIRTUOSA5",
    kind: "fixed_amount",
    amountCents: 500,
    label: "US$ 5 de desconto",
  },
];

export function normalizeCouponCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function validateCoupon(
  code: string,
  subtotalCents: number,
  fulfillmentType: "shipping" | "pickup",
  now = new Date(),
): CouponValidation {
  const normalized = normalizeCouponCode(code);
  const coupon = COUPONS.find((candidate) => candidate.code === normalized);
  if (!coupon) return { valid: false, error: "Cupom invalido." };

  if (coupon.validFrom && now < new Date(coupon.validFrom)) {
    return { valid: false, error: "Este cupom ainda nao esta disponivel." };
  }
  if (coupon.validUntil && now > new Date(coupon.validUntil)) {
    return { valid: false, error: "Este cupom expirou." };
  }
  if (coupon.kind === "free_shipping" && fulfillmentType !== "shipping") {
    return { valid: false, error: "Selecione Envio USPS para usar o frete gratis." };
  }
  if (coupon.kind === "fixed_amount" && subtotalCents <= coupon.amountCents) {
    return { valid: false, error: `A compra precisa ser maior que ${coupon.label.replace(" de desconto", "")}.` };
  }

  return { valid: true, coupon };
}
