import { cn } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductBadgeProps {
  badge: Product["badge"];
  className?: string;
}

const badgeConfig = {
  "best-seller": { label: "Best Seller", className: "bg-virtuosa-antique-gold text-white" },
  "new":         { label: "New",         className: "bg-virtuosa-deep-brown text-white" },
  "sale":        { label: "Sale",        className: "bg-red-700 text-white" },
};

export function ProductBadge({ badge, className }: ProductBadgeProps) {
  if (!badge) return null;
  const config = badgeConfig[badge];

  return (
    <span
      className={cn(
        "absolute top-3 left-3 z-10",
        "inline-block px-2.5 py-1",
        "font-sans text-[11px] font-semibold tracking-[0.08em] uppercase",
        "rounded-[2px]",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
