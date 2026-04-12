import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import JobCard from "@/components/ui/JobCard";
import RateClientInline from "./rate-client-inline";
import { createServerSupabaseClient } from "@/lib/supabase";
import { waUrl as buildWaUrl } from "@/lib/whatsapp";
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
        applicants, posted_at, photos, client_phone, client_name, user_id
      )
    `)
    .eq("worker_id", user.id)
    .order("created_at", { ascending: false });

  type AppRow = {
    created_at: string;
    status: string;
    message: string | null;
    jobs: (Partial<Job> & { user_id?: string | null }) | null;
  };
  const rows = (applications ?? []) as AppRow[];

  const activos    = rows.filter((r) => r.jobs?.status === "abierto");
  const terminados = rows.filter((r) => r.jobs?.status === "cerrado");

  // Check which terminated+accepted jobs the worker hasn't rated the client yet
  const terminadosAceptados = terminados.filter((r) => r.status === "accepted" && r.jobs?.id);
  let alreadyRatedClientSet = new Set<number>();
  if (terminadosAceptados.length > 0) {
    const jobIds = terminadosAceptados.map((r) => r.jobs!.id as number);
    const { data: existingClientRatings } = await supabase
      .from("client_ratings")
      .select("job_id")
      .in("job_id", jobIds)
      .eq("worker_id", user.id);
    alreadyRatedClientSet = new Set((existingClientRatings ?? []).map((r) => r.job_id as number));
  }

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
      user_id: row.jobs!.user_id ?? null,
      updated_at: row.created_at,
    };
  }

  function waUrl(row: AppRow): string | null {
    const jobTitle = row.jobs?.title ?? "";
    const clientName = row.jobs?.client_name ?? "";
    const defaultMsg = clientName
      ? `Hola ${clientName.split(" ")[0]}, vi tu publicación en Oficiando sobre "${jobTitle}". ¿Seguís buscando a alguien?`
      : `Hola, vi tu publicación en Oficiando sobre "${jobTitle}". ¿Seguís buscando a alguien?`;
    const msg = row.message ?? defaultMsg;
    return buildWaUrl(row.jobs?.client_phone, msg);
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
                  <JobCard
                    job={toJob(row)}
                    applicationStatus={row.status as "pending" | "accepted"}
                  />
                </Link>

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
          {terminados.map((row) => {
            if (!row.jobs) return null;
            const job = toJob(row);
            const clientId = row.jobs.user_id ?? null;
            const canRateClient =
              row.status === "accepted" &&
              clientId &&
              !alreadyRatedClientSet.has(job.id);

            return (
              <div key={job.id} className="flex flex-col gap-2">
                <JobCard job={job} />
                {canRateClient && (
                  <RateClientInline
                    jobId={job.id}
                    clientName={row.jobs.client_name ?? "el cliente"}
                  />
                )}
                {row.status === "accepted" && alreadyRatedClientSet.has(job.id) && (
                  <p className="text-xs text-emerald-600 font-medium px-1">
                    Calificación enviada ✓
                  </p>
                )}
              </div>
            );
          })}
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
