import Link from "next/link";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import Button from "@/components/ui/Button";
import { CATEGORIES } from "@/lib/categories";

export default function HomePage() {
  return (
    <>
      <Header />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-28 pt-8 flex flex-col gap-10">

        {/* ── Hero ────────────────────────────────────────────── */}
        <section className="flex flex-col gap-5">
          <h1 className="text-4xl font-black leading-tight tracking-tight text-primary">
            Encontrá al{" "}
            <span className="text-brand">profesional</span>{" "}
            que necesitás
          </h1>
          <p className="text-base text-secondary leading-relaxed">
            Publicá tu trabajo, recibí postulaciones y cerrá el trato directo
            por WhatsApp. Sin comisiones, sin intermediarios.
          </p>

          <div className="flex flex-col gap-3">
            <Button variant="brand" fullWidth>
              <Link href="/publicar" className="contents">
                Publicar trabajo gratis
              </Link>
            </Button>
            <Button variant="outline" fullWidth>
              <Link href="/trabajos" className="contents">
                Buscar trabajo
              </Link>
            </Button>
          </div>
        </section>

        {/* ── Categorías ──────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-primary">¿Qué necesitás?</h2>
          <div className="grid grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/trabajos?categoria=${cat.id}`}
                className={[
                  "flex flex-col items-center gap-2 rounded-lg py-4 px-2",
                  "border border-border bg-card",
                  "transition-colors duration-150 hover:border-[rgba(232,98,42,0.3)]",
                  "active:scale-[0.97]",
                ].join(" ")}
              >
                <span className="text-2xl leading-none">{cat.icon}</span>
                <span
                  className="text-xs font-medium text-center leading-tight"
                  style={{ color: cat.textColor }}
                >
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Cómo funciona ───────────────────────────────────── */}
        <section className="flex flex-col gap-5">
          <h2 className="text-lg font-bold text-primary">¿Cómo funciona?</h2>
          <ol className="flex flex-col gap-4">
            {[
              {
                n: "1",
                title: "Publicás el trabajo",
                desc: "Elegís la categoría, describís qué necesitás y listo. Menos de un minuto.",
              },
              {
                n: "2",
                title: "Recibís postulaciones",
                desc: "Los trabajadores de tu zona te mandan mensajes con su propuesta.",
              },
              {
                n: "3",
                title: "Cerrás por WhatsApp",
                desc: "Elegís al que más te conviene y coordinan directo. Sin comisiones.",
              },
            ].map((step) => (
              <li key={step.n} className="flex gap-4 items-start">
                <span
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: "#e8622a" }}
                >
                  {step.n}
                </span>
                <div className="flex flex-col gap-1">
                  <p className="text-base font-semibold text-primary">{step.title}</p>
                  <p className="text-sm text-secondary leading-relaxed">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Propuesta de valor ──────────────────────────────── */}
        <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-bold text-primary">
            100% gratis, siempre
          </h2>
          <p className="text-sm text-secondary leading-relaxed">
            La plata va directo del cliente al trabajador. Oficiando no cobra
            comisión ni cobrará nunca. La app existe para conectarlos, no para
            quedarse con nada.
          </p>
        </section>

      </main>

      <BottomNav />
    </>
  );
}
