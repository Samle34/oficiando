import { getCategory } from "@/lib/categories";

interface CategoryTagProps {
  categoryId: string;
  size?: "sm" | "md";
}

export default function CategoryTag({ categoryId, size = "md" }: CategoryTagProps) {
  const cat = getCategory(categoryId);

  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full font-medium",
        size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1",
      ].join(" ")}
      style={{
        backgroundColor: cat.bgLight,
        color: cat.textColor,
      }}
    >
      <span aria-hidden="true">{cat.icon}</span>
      {cat.label}
    </span>
  );
}
