/* Color determinístico según la primera letra del nombre —
   el mismo nombre siempre produce el mismo color. */
const AVATAR_PALETTES = [
  { bg: "#fde68a", text: "#92400e" }, // amber
  { bg: "#bfdbfe", text: "#1e3a8a" }, // blue
  { bg: "#a7f3d0", text: "#064e3b" }, // emerald
  { bg: "#ddd6fe", text: "#4c1d95" }, // violet
  { bg: "#fecdd3", text: "#881337" }, // rose
  { bg: "#bbf7d0", text: "#14532d" }, // green
  { bg: "#fed7aa", text: "#7c2d12" }, // orange
];

function getPalette(name: string) {
  const code = name.toUpperCase().charCodeAt(0);
  return AVATAR_PALETTES[code % AVATAR_PALETTES.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-12 h-12 text-base",
};

export default function Avatar({ name, avatarUrl, size = "md" }: AvatarProps) {
  if (avatarUrl) {
    return (
      <span
        className={["inline-block rounded-full overflow-hidden shrink-0", sizes[size]].join(" ")}
        aria-label={name}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
      </span>
    );
  }

  const palette = getPalette(name);

  return (
    <span
      className={[
        "inline-flex items-center justify-center rounded-full font-semibold shrink-0",
        sizes[size],
      ].join(" ")}
      style={{ backgroundColor: palette.bg, color: palette.text }}
      aria-label={name}
    >
      {initials(name)}
    </span>
  );
}
