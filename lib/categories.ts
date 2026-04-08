export type CategoryId =
  | "plomeria"
  | "electricidad"
  | "limpieza"
  | "albanileria"
  | "pintura"
  | "jardineria"
  | "mudanzas"
  | "otros";

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;
  /** CSS color for the left border signature and tag accent */
  color: string;
  /** Light bg for the category tag pill */
  bgLight: string;
  /** Text color on the light bg */
  textColor: string;
}

export const CATEGORIES: Category[] = [
  {
    id: "plomeria",
    label: "Plomería",
    icon: "🔧",
    color: "#d97706",
    bgLight: "#fef3c7",
    textColor: "#92400e",
  },
  {
    id: "electricidad",
    label: "Electricidad",
    icon: "⚡",
    color: "#2563eb",
    bgLight: "#dbeafe",
    textColor: "#1e3a8a",
  },
  {
    id: "limpieza",
    label: "Limpieza",
    icon: "🧹",
    color: "#059669",
    bgLight: "#d1fae5",
    textColor: "#064e3b",
  },
  {
    id: "albanileria",
    label: "Albañilería",
    icon: "🧱",
    color: "#7c3aed",
    bgLight: "#ede9fe",
    textColor: "#4c1d95",
  },
  {
    id: "pintura",
    label: "Pintura",
    icon: "🎨",
    color: "#e11d48",
    bgLight: "#ffe4e6",
    textColor: "#881337",
  },
  {
    id: "jardineria",
    label: "Jardinería",
    icon: "🌱",
    color: "#16a34a",
    bgLight: "#dcfce7",
    textColor: "#14532d",
  },
  {
    id: "mudanzas",
    label: "Mudanzas",
    icon: "📦",
    color: "#ea580c",
    bgLight: "#ffedd5",
    textColor: "#7c2d12",
  },
  {
    id: "otros",
    label: "Otros",
    icon: "🔨",
    color: "#6b7280",
    bgLight: "#f3f4f6",
    textColor: "#111827",
  },
];

export const CATEGORIES_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<CategoryId, Category>;

export function getCategory(id: string): Category {
  return CATEGORIES_MAP[id as CategoryId] ?? CATEGORIES_MAP["otros"];
}
