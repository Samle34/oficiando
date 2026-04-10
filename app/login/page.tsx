"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { signInWithPassword } from "@/app/auth/actions";

const inputClass = [
  "w-full h-11 px-4 rounded-md",
  "border border-border bg-card",
  "text-sm text-primary placeholder:text-tertiary",
  "focus:outline-none focus:border-brand",
  "transition-colors duration-150",
].join(" ");

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "login">("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!email.trim() || !password) return;
    setError(null);

    startTransition(async () => {
      const result = await signInWithPassword(email, password);
      if (result.status === "error") {
        setError(result.message);
      } else {
        router.refresh();
        router.push("/");
      }
    });
  }

  if (mode === "choose") {
    return (
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-12 pb-24 flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-black text-primary">Bienvenido</h1>
            <p className="text-sm text-secondary leading-relaxed">
              ¿Ya tenés cuenta o querés crear una nueva?
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/registro">
              <Button variant="brand" fullWidth>
                Crear cuenta
              </Button>
            </Link>
            <Button variant="outline" fullWidth onClick={() => setMode("login")}>
              Iniciar sesión
            </Button>
          </div>
        </main>
    );
  }

  return (
    <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-12 pb-24 flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setMode("choose")}
            className="text-sm text-brand font-medium self-start"
          >
            ← Volver
          </button>
          <h1 className="text-2xl font-black text-primary">Iniciá sesión</h1>
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
              placeholder="nombre@ejemplo.com"
              autoComplete="email"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-semibold text-primary">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Tu contraseña"
              autoComplete="current-password"
              className={inputClass}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 font-medium">{error}</p>
          )}

          <Button
            variant="brand"
            fullWidth
            disabled={!email.trim() || !password || isPending}
            onClick={handleSubmit}
          >
            {isPending ? "Ingresando..." : "Ingresar"}
          </Button>

          <Link
            href="/recuperar-contrasena"
            className="text-xs text-tertiary text-center hover:text-secondary transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <p className="text-xs text-tertiary text-center leading-relaxed">
          Al ingresar aceptás los términos de uso de Oficiando.
        </p>
    </main>
  );
}
