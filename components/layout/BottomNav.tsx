"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Role = "client" | "worker" | null;

const CLIENT_NAV = [
  { href: "/", label: "Inicio", icon: "🏠", highlight: false },
  { href: "/trabajos", label: "Trabajos", icon: "📋", highlight: false },
  { href: "/publicar", label: "Publicar", icon: "➕", highlight: true },
  { href: "/mis-proyectos", label: "Proyectos", icon: "📁", highlight: false },
  { href: "/perfil", label: "Mi perfil", icon: "👤", highlight: false },
];

const WORKER_NAV = [
  { href: "/", label: "Inicio", icon: "🏠", highlight: false },
  { href: "/trabajos", label: "Trabajos", icon: "📋", highlight: false },
  { href: "/mis-trabajos", label: "Mis trabajos", icon: "🗂️", highlight: false },
  { href: "/perfil", label: "Mi perfil", icon: "👤", highlight: false },
];

const GUEST_NAV = [
  { href: "/", label: "Inicio", icon: "🏠" },
  { href: "/trabajos", label: "Trabajos", icon: "📋" },
  { href: "/publicar", label: "Publicar", icon: "➕", highlight: true },
  { href: "/perfil", label: "Mi perfil", icon: "👤" },
];

function getNavItems(role: Role) {
  if (role === "client") return CLIENT_NAV;
  if (role === "worker") return WORKER_NAV;
  return GUEST_NAV;
}

export default function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const navItems = getNavItems(role);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border safe-area-pb">
      <div className="max-w-lg mx-auto flex">
        {navItems.map((item) => {
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
