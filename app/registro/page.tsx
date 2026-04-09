"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import Button from "@/components/ui/Button";
import { registerWithProfile } from "@/app/auth/actions";

export default function RegistroPage() {
  const [form, setForm] = useState({ email: "", full_name: "", phone: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await registerWithProfile(form);
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
                <span className="font-semibold text-primary">{form.email}</span>.
                Tocalo para activar tu cuenta.
              </p>
            </div>
            <button
              onClick={() => { setSent(false); setForm({ email: "", full_name: "", phone: "" }); }}
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

  return (
    <>
      <Header />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-12 pb-24 flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <Link href="/login" className="text-sm text-brand font-medium self-start">
            ← Volver
          </Link>
          <h1 className="text-2xl font-black text-primary">Crear cuenta</h1>
          <p className="text-sm text-secondary leading-relaxed">
            Creá tu cuenta gratis para publicar trabajos y gestionar tus proyectos.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {[
            { name: "full_name", label: "Tu nombre completo", type: "text", placeholder: "Juan García", autoComplete: "name" },
            { name: "phone", label: "Tu teléfono", type: "tel", placeholder: "+54 9 11 1234-5678", autoComplete: "tel" },
            { name: "email", label: "Tu email", type: "email", placeholder: "nombre@ejemplo.com", autoComplete: "email" },
          ].map(({ name, label, type, placeholder, autoComplete }) => (
            <div key={name} className="flex flex-col gap-2">
              <label htmlFor={name} className="text-sm font-semibold text-primary">
                {label}
              </label>
              <input
                id={name}
                name={name}
                type={type}
                value={form[name as keyof typeof form]}
                onChange={handleChange}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder={placeholder}
                autoComplete={autoComplete}
                className={[
                  "w-full h-11 px-4 rounded-md",
                  "border border-border bg-card",
                  "text-sm text-primary placeholder:text-tertiary",
                  "focus:outline-none focus:border-brand",
                  "transition-colors duration-150",
                ].join(" ")}
              />
            </div>
          ))}

          {error && (
            <p className="text-sm text-red-600 font-medium">{error}</p>
          )}

          <Button
            variant="brand"
            fullWidth
            disabled={!form.email.trim() || !form.full_name.trim() || !form.phone.trim() || isPending}
            onClick={handleSubmit}
          >
            {isPending ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </div>

        <p className="text-xs text-tertiary text-center leading-relaxed">
          Al crear tu cuenta aceptás los términos de uso de Oficiando.
        </p>
      </main>
      <BottomNav />
    </>
  );
}
