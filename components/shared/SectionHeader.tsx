import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: SectionHeaderProps) {
  const alignClass = align === "center" ? "text-center items-center" : "text-left items-start";

  return (
    <div className={cn("flex flex-col", alignClass, "mb-10 lg:mb-14", className)}>
      {eyebrow && (
        <span className="section-subtitle">{eyebrow}</span>
      )}
      <h2 className="section-title">{title}</h2>
      <span className="gold-divider" />
      {subtitle && (
        <p className="text-body text-virtuosa-light-brown max-w-prose mt-4">
          {subtitle}
        </p>
      )}
    </div>
  );
}
