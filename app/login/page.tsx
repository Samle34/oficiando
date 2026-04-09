"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import Button from "@/components/ui/Button";
import { sendMagicLink } from "@/app/auth/actions";

export default function LoginPage() {
  const [mode, setMode] = useState<"choose" | "login">("choose");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!email.trim()) return;
    setError(null);

    startTransition(async () => {
      const result = await sendMagicLink(email);
      if (result.status === "error") {
        setError(result.message);
      } else {
        setSent(true);
      }
    });
  }

  if (sent) {
    return (
      <>
        <Header />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-12 pb-24 flex flex-col gap-8">
          <div className="flex flex-col items-center gap-5 text-center pt-8">
            <span className="text-5xl">📬</span>
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold text-primary">Revisá tu email</h2>
              <p className="text-sm text-secondary leading-relaxed max-w-xs">
                Te mandamos un link a{" "}
                <span className="font-semibold text-primary">{email}</span>.
                Tocalo para entrar.
              </p>
            </div>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="text-sm text-brand font-medium"
            >
              Usar otro email
            </button>
          </div>
        </main>
        <BottomNav />
      </>
    );
  }

  if (mode === "choose") {
    return (
      <>
        <Header />
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
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-12 pb-24 flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setMode("choose")}
            className="text-sm text-brand font-medium self-start"
          >
            ← Volver
          </button>
          <h1 className="text-2xl font-black text-primary">Iniciá sesión</h1>
          <p className="text-sm text-secondary leading-relaxed">
            Te mandamos un link a tu email. Un toque y entrás — sin contraseña.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-semibold text-primary">
              Tu email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="nombre@ejemplo.com"
              autoComplete="email"
              className={[
                "w-full h-11 px-4 rounded-md",
                "border border-border bg-card",
                "text-sm text-primary placeholder:text-tertiary",
                "focus:outline-none focus:border-brand",
                "transition-colors duration-150",
              ].join(" ")}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 font-medium">{error}</p>
          )}

          <Button
            variant="brand"
            fullWidth
            disabled={!email.trim() || isPending}
            onClick={handleSubmit}
          >
            {isPending ? "Enviando..." : "Enviar link de acceso"}
          </Button>
        </div>

        <p className="text-xs text-tertiary text-center leading-relaxed">
          Al ingresar aceptás los términos de uso de Oficiando.
        </p>
      </main>
      <BottomNav />
    </>
  );
}
