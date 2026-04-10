"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { updatePassword } from "@/app/auth/actions";

const inputClass = [
  "w-full h-11 px-4 rounded-md",
  "border border-border bg-card",
  "text-sm text-primary placeholder:text-tertiary",
  "focus:outline-none focus:border-brand",
  "transition-colors duration-150",
].join(" ");

export default function NuevaContrasenaPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    startTransition(async () => {
      const result = await updatePassword(password);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/");
        router.refresh();
      }
    });
  }

  return (
    <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-12 pb-24 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-primary">Nueva contraseña</h1>
        <p className="text-sm text-secondary leading-relaxed">
          Elegí una contraseña nueva para tu cuenta.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-semibold text-primary">
            Nueva contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="confirm" className="text-sm font-semibold text-primary">
            Repetir contraseña
          </label>
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Repetí tu nueva contraseña"
            autoComplete="new-password"
            className={inputClass}
          />
        </div>

        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

        <Button
          variant="brand"
          fullWidth
          disabled={!password || !confirm || isPending}
          onClick={handleSubmit}
        >
          {isPending ? "Guardando..." : "Guardar contraseña"}
        </Button>
      </div>
    </main>
  );
}
