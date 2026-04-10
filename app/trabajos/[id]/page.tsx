import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getJobById } from "@/lib/jobs";
import { createServerSupabaseClient } from "@/lib/supabase";
import DetalleClient from "./detalle-client";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) return {};
  return {
    title: job.title,
    description: `${job.category_id} en ${job.city}, ${job.province}.`,
  };
}

export type Applicant = {
  worker_id: string;
  status: string;
  message: string | null;
  full_name: string;
  avatar_url: string | null;
  categories: string[];
  rating: number | null;
};

export default async function TrabajoDetallePage({ params }: Props) {
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) notFound();

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isWorker = false;
  let applicationStatus: "pending" | "accepted" | null = null;
  let applicationMessage: string | null = null;
  let applicants: Applicant[] = [];
  const isOwner = !!user && job.user_id === user.id;

  if (user && !isOwner) {
    const [profileResult, applicationResult] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      supabase
        .from("applications")
        .select("status, message")
        .eq("job_id", job.id)
        .eq("worker_id", user.id)
        .maybeSingle(),
    ]);
    isWorker = profileResult.data?.role === "worker";
    if (applicationResult.data) {
      applicationStatus = applicationResult.data.status as "pending" | "accepted";
      applicationMessage = applicationResult.data.message;
    }
  }

  if (isOwner) {
    const { data: apps } = await supabase
      .from("applications")
      .select("worker_id, status, message")
      .eq("job_id", job.id)
      .order("created_at", { ascending: true });

    if (apps && apps.length > 0) {
      const workerIds = apps.map((a) => a.worker_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, categories, rating")
        .in("id", workerIds);

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

      applicants = apps.map((a) => {
        const p = profileMap.get(a.worker_id);
        return {
          worker_id: a.worker_id,
          status: a.status,
          message: a.message,
          full_name: p?.full_name ?? "Trabajador",
          avatar_url: p?.avatar_url ?? null,
          categories: p?.categories ?? [],
          rating: p?.rating ?? null,
        };
      });
    }
  }

  return (
    <DetalleClient
      job={job}
      isWorker={isWorker}
      applicationStatus={applicationStatus}
      applicationMessage={applicationMessage}
      isOwner={isOwner}
      applicants={applicants}
    />
  );
}
