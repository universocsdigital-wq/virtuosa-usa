import { generateStars } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md";
  className?: string;
}

export function StarRating({
  rating,
  reviewCount,
  size = "sm",
  className,
}: StarRatingProps) {
  const { filled, empty } = generateStars(rating);
  const starSize = size === "sm" ? "text-sm" : "text-base";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex" aria-label={`${rating} out of 5 stars`}>
        {Array.from({ length: filled }).map((_, i) => (
          <span key={`filled-${i}`} className={cn("star-filled", starSize)}>
            ★
          </span>
        ))}
        {Array.from({ length: empty }).map((_, i) => (
          <span key={`empty-${i}`} className={cn("star-empty", starSize)}>
            ★
          </span>
        ))}
      </div>
      {reviewCount !== undefined && (
        <span className="text-caption text-virtuosa-medium-gray ml-1">
          ({reviewCount})
        </span>
      )}
    </div>
  );
}
