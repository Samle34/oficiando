"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import StarRating from "@/components/ui/StarRating";
import AvatarUpload from "./avatar-upload";
import WorkerSection from "./worker-section";
import PortfolioManager from "./portfolio-manager";
import { updateProfile, signOut } from "@/app/auth/actions";
import type { PortfolioItem } from "@/lib/profiles";

const inputClass = [
  "w-full h-11 px-4 rounded-md",
  "border border-border bg-card",
  "text-sm text-primary placeholder:text-tertiary",
  "focus:outline-none focus:border-brand",
  "transition-colors duration-150",
].join(" ");

const ROLE_LABELS: Record<"client" | "worker", string> = {
  client: "Cliente",
  worker: "Trabajador",
};

export default function PerfilClient({
  email,
  fullName: initialName,
  phone: initialPhone,
  role: initialRole,
  avatarUrl,
  bio,
  categories,
  workZones,
  rating,
  ratingCount,
  portfolioItems,
}: {
  email: string;
  fullName: string;
  phone: string;
  role: "client" | "worker";
  avatarUrl: string | null;
  bio: string | null;
  categories: string[];
  workZones: string[];
  rating: number;
  ratingCount: number;
  portfolioItems: PortfolioItem[];
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [role, setRole] = useState(initialRole);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();
  const [isSigningOut, startSignOut] = useTransition();
  const [isChangingRole, startRoleChange] = useTransition();

  function handleSave() {
    setError(null);
    setSaved(false);
    startSave(async () => {
      const result = await updateProfile({ full_name: fullName, phone });
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  }

  function handleRoleToggle() {
    const newRole = role === "client" ? "worker" : "client";
    startRoleChange(async () => {
      const result = await updateProfile({ role: newRole });
      if (!result.error) {
        setRole(newRole);
        router.refresh();
      }
    });
  }

  function handleSignOut() {
    startSignOut(async () => {
      await signOut();
      router.push("/");
      router.refresh();
    });
  }

  return (
    <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-24 pt-8 flex flex-col gap-6">

      {/* Avatar + nombre + email + rating */}
      <div className="flex flex-col items-center gap-3 text-center">
        <AvatarUpload name={fullName || email} avatarUrl={avatarUrl} />
        <div className="flex flex-col gap-1">
          <p className="text-base font-bold text-primary">{fullName || "Sin nombre"}</p>
          <p className="text-sm text-secondary">{email}</p>
          {role === "worker" && ratingCount > 0 && (
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <StarRating value={rating} size="sm" />
              <span className="text-xs text-secondary">{rating.toFixed(1)} ({ratingCount} reseña{ratingCount !== 1 ? "s" : ""})</span>
            </div>
          )}
        </div>

        {/* Rol badge + cambiar */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-brand">
            {ROLE_LABELS[role]}
          </span>
          <button
            type="button"
            disabled={isChangingRole}
            onClick={handleRoleToggle}
            className="text-xs text-secondary underline disabled:opacity-50"
          >
            {isChangingRole ? "..." : `Cambiar a ${role === "client" ? "trabajador" : "cliente"}`}
          </button>
        </div>
      </div>

      {/* Datos básicos */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="fullName" className="text-sm font-semibold text-primary">
            Tu nombre
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => { setFullName(e.target.value); setSaved(false); }}
            placeholder="Ej: Marcelo Rodríguez"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="phone" className="text-sm font-semibold text-primary">
            WhatsApp
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setSaved(false); }}
            placeholder="Ej: 1134567890"
            className={inputClass}
          />
          <p className="text-xs text-tertiary">
            Este número aparecerá en tus publicaciones
          </p>
        </div>

        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        {saved && <p className="text-sm text-emerald-600 font-medium">Perfil guardado</p>}

        <Button variant="brand" fullWidth disabled={isSaving} onClick={handleSave}>
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>

      {/* Sección trabajador */}
      {role === "worker" && (
        <>
          <WorkerSection bio={bio} categories={categories} workZones={workZones} />
          <div className="h-px bg-border" />
          <PortfolioManager initialItems={portfolioItems} />
        </>
      )}

      {/* Cerrar sesión */}
      <div className="pt-4 border-t border-border">
        <Button variant="outline" fullWidth disabled={isSigningOut} onClick={handleSignOut}>
          {isSigningOut ? "Cerrando sesión..." : "Cerrar sesión"}
        </Button>
      </div>
    </main>
  );
}
