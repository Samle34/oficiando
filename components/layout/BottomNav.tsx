"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Inicio", icon: "🏠" },
  { href: "/trabajos", label: "Trabajos", icon: "📋" },
  { href: "/publicar", label: "Publicar", icon: "➕", highlight: true },
  { href: "/mis-proyectos", label: "Proyectos", icon: "📁" },
  { href: "/perfil", label: "Mi perfil", icon: "👤" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border safe-area-pb">
      <div className="max-w-lg mx-auto flex">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex-1 flex flex-col items-center justify-center gap-1 py-3",
                "text-xs font-medium transition-colors duration-150",
                item.highlight
                  ? "text-brand"
                  : isActive
                  ? "text-primary"
                  : "text-tertiary hover:text-secondary",
              ].join(" ")}
            >
              <span className="text-xl leading-none" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
