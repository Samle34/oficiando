import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import JobCard from "@/components/ui/JobCard";
import CloseJobButton from "@/components/ui/CloseJobButton";
import { createServerSupabaseClient } from "@/lib/supabase";
import type { Job } from "@/lib/jobs";

export const metadata: Metadata = {
  title: "Mis proyectos",
  description: "Tus trabajos publicados y postulaciones activas en Oficiando.",
};

export default async function MisProyectosPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, category_id, province, city, status, applicants, posted_at, client_name, client_phone, description, user_id, updated_at")
    .eq("user_id", user.id)
    .order("posted_at", { ascending: false });

  const allJobs = (jobs ?? []) as Job[];
  const abiertos = allJobs.filter((j) => j.status === "abierto");
  const cerrados = allJobs.filter((j) => j.status === "cerrado");

  return (
    <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-24 pt-8 flex flex-col gap-8">

        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-primary">Mis proyectos</h1>
          <p className="text-sm text-secondary">
            Tus trabajos publicados y postulaciones activas
          </p>
        </div>

        {abiertos.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-secondary uppercase tracking-wide">
              Abiertos
            </h2>
            {abiertos.map((job) => (
              <div key={job.id} className="flex flex-col">
                <JobCard job={job} />
                <CloseJobButton jobId={job.id} />
              </div>
            ))}
          </section>
        )}

        {cerrados.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-secondary uppercase tracking-wide">
              Cerrados
            </h2>
            {cerrados.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </section>
        )}

        {allJobs.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-5xl">📁</span>
            <p className="text-base font-semibold text-primary">
              Todavía no publicaste nada
            </p>
            <p className="text-sm text-secondary max-w-xs leading-relaxed">
              Publicá tu primer trabajo y aparecerá acá.
            </p>
            <Link href="/publicar" className="mt-1 text-sm font-semibold text-brand">
              Publicar trabajo →
            </Link>
          </div>
        )}
    </main>
  );
}
