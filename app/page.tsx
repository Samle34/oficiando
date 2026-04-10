import Link from "next/link";
import Button from "@/components/ui/Button";
import { CATEGORIES } from "@/lib/categories";
import { createServerSupabaseClient } from "@/lib/supabase";

async function getUserRole(): Promise<"client" | "worker" | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return (data?.role as "client" | "worker") ?? null;
}

const STEPS_CLIENT = [
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
];

const STEPS_WORKER = [
  {
    n: "1",
    title: "Completás tu perfil",
    desc: "Agregás tu foto, bio, categorías y zonas donde trabajás para que los clientes te encuentren.",
  },
  {
    n: "2",
    title: "Explorás trabajos disponibles",
    desc: "Ves los trabajos publicados por clientes en tu zona y elegís los que te interesan.",
  },
  {
    n: "3",
    title: "Contactás por WhatsApp",
    desc: "Le mandás un mensaje directo al cliente y coordinan el trabajo sin comisiones.",
  },
];

function StepList({ steps }: { steps: typeof STEPS_CLIENT }) {
  return (
    <ol className="flex flex-col gap-4">
      {steps.map((step) => (
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
  );
}

function ValueProp({ text }: { text: string }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <h2 className="text-base font-bold text-primary">100% gratis, siempre</h2>
      <p className="text-sm text-secondary leading-relaxed">{text}</p>
    </section>
  );
}

function CategoryGrid({ href }: { href: (catId: string) => string }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {CATEGORIES.map((cat) => (
        <Link
          key={cat.id}
          href={href(cat.id)}
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
  );
}

export default async function HomePage() {
  const role = await getUserRole();

  if (role === "worker") {
    return (
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-28 pt-8 flex flex-col gap-10">
        <section className="flex flex-col gap-5">
          <h1 className="text-4xl font-black leading-tight tracking-tight text-primary">
            Encontrá{" "}
            <span className="text-brand">trabajos</span>{" "}
            cerca tuyo
          </h1>
          <p className="text-base text-secondary leading-relaxed">
            Explorá los trabajos publicados por clientes en tu zona y
            contactalos directo por WhatsApp. Sin intermediarios.
          </p>
          <Button variant="brand" fullWidth>
            <Link href="/trabajos" className="contents">
              Ver trabajos disponibles
            </Link>
          </Button>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-primary">Explorar por categoría</h2>
          <CategoryGrid href={(id) => `/trabajos?categoria=${id}`} />
        </section>

        <section className="flex flex-col gap-5">
          <h2 className="text-lg font-bold text-primary">¿Cómo funciona?</h2>
          <StepList steps={STEPS_WORKER} />
        </section>

        <ValueProp text="Officiando no cobra comisión ni cobrará nunca. La plata es tuya. La app existe para conectarte con clientes, no para quedarse con nada." />
      </main>
    );
  }

  if (role === "client") {
    return (
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-28 pt-8 flex flex-col gap-10">
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
          <Button variant="brand" fullWidth>
            <Link href="/publicar" className="contents">
              Publicar trabajo gratis
            </Link>
          </Button>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-primary">¿Qué necesitás?</h2>
          <CategoryGrid href={() => "/publicar"} />
        </section>

        <section className="flex flex-col gap-5">
          <h2 className="text-lg font-bold text-primary">¿Cómo funciona?</h2>
          <StepList steps={STEPS_CLIENT} />
        </section>

        <ValueProp text="La plata va directo del cliente al trabajador. Officiando no cobra comisión ni cobrará nunca. La app existe para conectarlos, no para quedarse con nada." />
      </main>
    );
  }

  // Guest (not logged in)
  return (
    <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-28 pt-8 flex flex-col gap-10">
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

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-primary">¿Qué necesitás?</h2>
        <CategoryGrid href={(id) => `/trabajos?categoria=${id}`} />
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-lg font-bold text-primary">¿Cómo funciona?</h2>
        <StepList steps={STEPS_CLIENT} />
      </section>

      <ValueProp text="La plata va directo del cliente al trabajador. Officiando no cobra comisión ni cobrará nunca. La app existe para conectarlos, no para quedarse con nada." />
    </main>
  );
}
