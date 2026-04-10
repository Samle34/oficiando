import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import JobCard from "@/components/ui/JobCard";
import { createServerSupabaseClient } from "@/lib/supabase";
import type { Job } from "@/lib/jobs";

export const metadata: Metadata = {
  title: "Mis trabajos",
  description: "Tus postulaciones activas y trabajos realizados.",
};

export default async function MisTrabajosPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "worker") redirect("/");

  const { data: applications } = await supabase
    .from("applications")
    .select(`
      created_at, status, message,
      jobs (
        id, title, category_id, province, city, status,
        applicants, posted_at, photos, client_phone, client_name
      )
    `)
    .eq("worker_id", user.id)
    .order("created_at", { ascending: false });

  type AppRow = {
    created_at: string;
    status: string;
    message: string | null;
    jobs: Partial<Job> | null;
  };
  const rows = (applications ?? []) as AppRow[];

  const activos = rows.filter((r) => r.jobs?.status === "abierto");
  const terminados = rows.filter((r) => r.jobs?.status === "cerrado");

  function toJob(row: AppRow): Job {
    return {
      id: row.jobs!.id!,
      title: row.jobs!.title!,
      category_id: row.jobs!.category_id!,
      province: row.jobs!.province!,
      city: row.jobs!.city!,
      status: row.jobs!.status as Job["status"],
      applicants: row.jobs!.applicants ?? 0,
      posted_at: row.jobs!.posted_at!,
      photos: row.jobs!.photos ?? [],
      description: null,
      client_name: row.jobs!.client_name ?? null,
      client_phone: row.jobs!.client_phone ?? null,
      user_id: null,
      updated_at: row.created_at,
    };
  }

  function waUrl(row: AppRow): string | null {
    const phone = row.jobs?.client_phone;
    if (!phone) return null;
    const jobTitle = row.jobs?.title ?? "";
    const clientName = row.jobs?.client_name ?? "";
    const defaultMsg = clientName
      ? `Hola ${clientName.split(" ")[0]}, vi tu publicación en Oficiando sobre "${jobTitle}". ¿Seguís buscando a alguien?`
      : `Hola, vi tu publicación en Oficiando sobre "${jobTitle}". ¿Seguís buscando a alguien?`;
    const msg = row.message ?? defaultMsg;
    return `https://wa.me/54${phone}?text=${encodeURIComponent(msg)}`;
  }

  return (
    <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-24 pt-8 flex flex-col gap-8">

      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-primary">Mis trabajos</h1>
        <p className="text-sm text-secondary">
          Tus postulaciones activas y trabajos realizados
        </p>
      </div>

      {activos.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-secondary uppercase tracking-wide">
            Activos
          </h2>
          {activos.map((row) =>
            row.jobs ? (
              <div key={row.jobs.id} className="flex flex-col gap-2">
                <Link href={`/trabajos/${row.jobs.id}`}>
                  <JobCard job={toJob(row)} />
                </Link>

                {/* Badge de estado */}
                <div className="flex items-center justify-between px-1">
                  {row.status === "accepted" ? (
                    <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                      Aceptado ✓
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-secondary flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
                      Pendiente
                    </span>
                  )}
                </div>

                {/* Botón Contactar solo si fue aceptado */}
                {row.status === "accepted" && (
                  waUrl(row) ? (
                    <a href={waUrl(row)!} target="_blank" rel="noopener noreferrer" className="block">
                      <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-[#22c55e] text-white text-sm font-semibold">
                        <span>💬</span> Contactar por WhatsApp
                      </button>
                    </a>
                  ) : (
                    <p className="text-xs text-tertiary text-center">
                      El cliente no agregó su número de WhatsApp
                    </p>
                  )
                )}
              </div>
            ) : null
          )}
        </section>
      )}

      {terminados.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-secondary uppercase tracking-wide">
            Terminados
          </h2>
          {terminados.map((row) =>
            row.jobs ? (
              <JobCard key={row.jobs.id} job={toJob(row)} />
            ) : null
          )}
        </section>
      )}

      {rows.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-5xl">🗂️</span>
          <p className="text-base font-semibold text-primary">
            Todavía no te postulaste a ningún trabajo
          </p>
          <p className="text-sm text-secondary max-w-xs leading-relaxed">
            Explorá los trabajos disponibles y tocá "Quiero este trabajo" para aparecer acá.
          </p>
          <Link href="/trabajos" className="mt-1 text-sm font-semibold text-brand">
            Ver trabajos disponibles →
          </Link>
        </div>
      )}

    </main>
  );
}
