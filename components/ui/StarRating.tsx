interface StarRatingProps {
  value: number;           // 0–5, decimals allowed for display
  interactive?: boolean;   // default false — display only
  onChange?: (score: number) => void;
  size?: "sm" | "md";
}

const starSizes = { sm: "text-base", md: "text-xl" };

export default function StarRating({
  value,
  interactive = false,
  onChange,
  size = "md",
}: StarRatingProps) {
  return (
    <span className={["inline-flex gap-0.5", starSizes[size]].join(" ")}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = value >= n;
        return (
          <span
            key={n}
            aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
            className={interactive ? "cursor-pointer select-none" : "select-none"}
            style={{ color: filled ? "#e8622a" : "#d1ccc5" }}
            onClick={interactive ? () => onChange?.(n) : undefined}
          >
            ★
          </span>
        );
      })}
    </span>
  );
}
