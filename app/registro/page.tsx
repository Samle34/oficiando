"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import PhoneInput, { type PhoneValue } from "@/components/ui/PhoneInput";
import { registerWithProfile } from "@/app/auth/actions";
import { PROVINCES_BY_COUNTRY } from "@/lib/provinces";

const COUNTRIES = [
  "Argentina", "Uruguay", "Brasil", "Chile", "Paraguay", "Bolivia",
  "Perú", "Colombia", "Venezuela", "Ecuador", "México", "Cuba",
  "República Dominicana", "Guatemala", "Costa Rica", "Panamá",
  "España", "Estados Unidos", "Canadá", "Reino Unido", "Alemania",
  "Francia", "Italia", "Portugal", "China", "Japón", "Corea del Sur",
  "India", "Australia", "Sudáfrica", "Nigeria", "Marruecos", "Rusia",
  "Otro",
];

const selectClass = [
  "w-full h-11 px-3 rounded-md",
  "border border-border bg-card",
  "text-sm text-primary",
  "focus:outline-none focus:border-brand",
  "transition-colors duration-150",
  "cursor-pointer",
].join(" ");

const inputClass = [
  "w-full h-11 px-4 rounded-md",
  "border border-border bg-card",
  "text-sm text-primary placeholder:text-tertiary",
  "focus:outline-none focus:border-brand",
  "transition-colors duration-150",
].join(" ");

export default function RegistroPage() {
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    nationality: "Argentina",
    province: "",
  });
  const [phone, setPhone] = useState<PhoneValue>({ prefix: "+54", number: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const provinceList = PROVINCES_BY_COUNTRY[form.nationality] ?? null;

  function set(field: string, val: string) {
    setForm((prev) => ({ ...prev, [field]: val }));
  }

  function handleSubmit() {
    setError(null);
    const fullPhone = `${phone.prefix} ${phone.number}`.trim();
    const province = form.province;

    startTransition(async () => {
      const result = await registerWithProfile({
        email: form.email,
        full_name: form.full_name,
        phone: fullPhone,
        nationality: form.nationality,
        province,
      });
      if (result.status === "error") {
        setError(result.message);
      } else {
        setSent(true);
      }
    });
  }

  const canSubmit =
    form.email.trim() &&
    form.full_name.trim() &&
    phone.number.trim() &&
    form.nationality &&
    form.province.trim() &&
    !isPending;

  if (sent) {
    return (
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
              onClick={() => {
                setSent(false);
                setForm({ email: "", full_name: "", nationality: "Argentina", province: "" });
                setPhone({ prefix: "+54", number: "" });
              }}
              className="text-sm text-brand font-medium"
            >
              Usar otro email
            </button>
          </div>
        </main>
    );
  }

  return (
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

        <div className="flex flex-col gap-4">
          {/* Nombre */}
          <div className="flex flex-col gap-2">
            <label htmlFor="full_name" className="text-sm font-semibold text-primary">
              Nombre completo
            </label>
            <input
              id="full_name"
              type="text"
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              placeholder="Juan García"
              autoComplete="name"
              className={inputClass}
            />
          </div>

          {/* Teléfono */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-primary">Teléfono</label>
            <PhoneInput value={phone} onChange={setPhone} />
          </div>

          {/* Nacionalidad */}
          <div className="flex flex-col gap-2">
            <label htmlFor="nationality" className="text-sm font-semibold text-primary">
              Nacionalidad
            </label>
            <select
              id="nationality"
              value={form.nationality}
              onChange={(e) => {
                set("nationality", e.target.value);
                set("province", "");
              }}
              className={selectClass}
            >
              <option value="" disabled>Seleccioná tu país</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Provincia / Estado */}
          <div className="flex flex-col gap-2">
            <label htmlFor="province" className="text-sm font-semibold text-primary">
              Provincia / Estado
            </label>
            {provinceList ? (
              <select
                id="province"
                value={form.province}
                onChange={(e) => set("province", e.target.value)}
                className={selectClass}
              >
                <option value="" disabled>Seleccioná tu provincia / estado</option>
                {provinceList.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            ) : (
              <input
                id="province"
                type="text"
                value={form.province}
                onChange={(e) => set("province", e.target.value)}
                placeholder="Ingresá tu provincia o estado"
                className={inputClass}
              />
            )}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-semibold text-primary">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="nombre@ejemplo.com"
              autoComplete="email"
              className={inputClass}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 font-medium">{error}</p>
          )}

          <Button
            variant="brand"
            fullWidth
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {isPending ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </div>

        <p className="text-xs text-tertiary text-center leading-relaxed">
          Al crear tu cuenta aceptás los términos de uso de Oficiando.
        </p>
    </main>
  );
}
