import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import JobCard from "@/components/ui/JobCard";
import CloseJobButton from "@/components/ui/CloseJobButton";
import RateWorkersInline from "./rate-workers-inline";
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
  const cerrados  = allJobs.filter((j) => j.status === "cerrado");

  // For closed jobs: find which ones have accepted workers not yet rated
  type PendingMap = Record<number, { workerId: string; full_name: string; avatar_url: string | null }[]>;
  let pendingByJob: PendingMap = {};

  if (cerrados.length > 0) {
    const cerradosIds = cerrados.map((j) => j.id);

    // Accepted applications for all closed jobs
    const { data: apps } = await supabase
      .from("applications")
      .select("job_id, worker_id")
      .in("job_id", cerradosIds)
      .eq("status", "accepted");

    if (apps && apps.length > 0) {
      const workerIds = [...new Set(apps.map((a) => a.worker_id as string))];

      // Worker profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", workerIds);

      const profileMap = new Map((profiles ?? []).map((p) => [p.id as string, p]));

      // Already-rated worker_ids per job
      const { data: existingRatings } = await supabase
        .from("ratings")
        .select("job_id, worker_id")
        .in("job_id", cerradosIds);

      const ratedSet = new Set(
        (existingRatings ?? []).map((r) => `${r.job_id}:${r.worker_id}`)
      );

      for (const app of apps) {
        const key = `${app.job_id}:${app.worker_id}`;
        if (!ratedSet.has(key)) {
          const profile = profileMap.get(app.worker_id as string);
          if (profile) {
            if (!pendingByJob[app.job_id as number]) pendingByJob[app.job_id as number] = [];
            pendingByJob[app.job_id as number].push({
              workerId: app.worker_id as string,
              full_name: (profile.full_name ?? "Trabajador") as string,
              avatar_url: profile.avatar_url as string | null,
            });
          }
        }
      }
    }
  }

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
          {cerrados.map((job) => {
            const pending = pendingByJob[job.id] ?? [];
            return (
              <div key={job.id} className="flex flex-col gap-2">
                <JobCard job={job} />
                {pending.length > 0 && (
                  <RateWorkersInline jobId={job.id} workers={pending} />
                )}
              </div>
            );
          })}
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
