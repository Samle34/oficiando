"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { requestPasswordReset } from "@/app/auth/actions";

const inputClass = [
  "w-full h-11 px-4 rounded-md",
  "border border-border bg-card",
  "text-sm text-primary placeholder:text-tertiary",
  "focus:outline-none focus:border-brand",
  "transition-colors duration-150",
].join(" ");

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!email.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await requestPasswordReset(email);
      if (result.error) {
        setError(result.error);
      } else {
        setSent(true);
      }
    });
  }

  if (sent) {
    return (
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-12 pb-24 flex flex-col gap-6 items-center text-center">
        <span className="text-5xl">📬</span>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-black text-primary">Revisá tu email</h1>
          <p className="text-sm text-secondary leading-relaxed max-w-xs">
            Te enviamos un enlace para restablecer tu contraseña a{" "}
            <span className="font-semibold text-primary">{email}</span>.
          </p>
        </div>
        <Link href="/login" className="text-sm font-semibold text-brand">
          Volver al inicio
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-12 pb-24 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link href="/login" className="text-sm text-brand font-medium self-start">
          ← Volver
        </Link>
        <h1 className="text-2xl font-black text-primary">Recuperar contraseña</h1>
        <p className="text-sm text-secondary leading-relaxed">
          Ingresá tu email y te mandamos un enlace para crear una nueva contraseña.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-semibold text-primary">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="nombre@ejemplo.com"
            autoComplete="email"
            className={inputClass}
          />
        </div>

        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

        <Button
          variant="brand"
          fullWidth
          disabled={!email.trim() || isPending}
          onClick={handleSubmit}
        >
          {isPending ? "Enviando..." : "Enviar enlace"}
        </Button>
      </div>
    </main>
  );
}
