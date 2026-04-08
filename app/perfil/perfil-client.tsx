"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import { updateProfile, signOut } from "@/app/auth/actions";

export default function PerfilClient({
  email,
  fullName: initialName,
  phone: initialPhone,
}: {
  email: string;
  fullName: string;
  phone: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();
  const [isSigningOut, startSignOut] = useTransition();

  function handleSave() {
    setError(null);
    setSaved(false);
    startSave(async () => {
      const result = await updateProfile({ full_name: fullName, phone });
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
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

  const inputClass = [
    "w-full h-11 px-4 rounded-md",
    "border border-border bg-card",
    "text-sm text-primary placeholder:text-tertiary",
    "focus:outline-none focus:border-brand",
    "transition-colors duration-150",
  ].join(" ");

  return (
    <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-24 pt-8 flex flex-col gap-6">

      {/* Header del perfil */}
      <div className="flex items-center gap-4">
        <Avatar name={fullName || email} size="lg" />
        <div className="flex flex-col">
          <p className="text-base font-bold text-primary">
            {fullName || "Sin nombre"}
          </p>
          <p className="text-sm text-secondary">{email}</p>
        </div>
      </div>

      {/* Formulario */}
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
            Este número aparecerá en tus publicaciones para que los trabajadores te contacten
          </p>
        </div>

        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        {saved && <p className="text-sm text-emerald-600 font-medium">Perfil guardado</p>}

        <Button
          variant="brand"
          fullWidth
          disabled={isSaving}
          onClick={handleSave}
        >
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>

      {/* Cerrar sesión */}
      <div className="pt-4 border-t border-border">
        <Button
          variant="outline"
          fullWidth
          disabled={isSigningOut}
          onClick={handleSignOut}
        >
          {isSigningOut ? "Cerrando sesión..." : "Cerrar sesión"}
        </Button>
      </div>
    </main>
  );
}
