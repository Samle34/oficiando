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

export default async function TrabajoDetallePage({ params }: Props) {
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) notFound();

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isWorker = false;
  let hasApplied = false;

  if (user) {
    const [profileResult, applicationResult] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      supabase.from("applications").select("id").eq("job_id", job.id).eq("worker_id", user.id).maybeSingle(),
    ]);
    isWorker = profileResult.data?.role === "worker";
    hasApplied = !!applicationResult.data;
  }

  return <DetalleClient job={job} isWorker={isWorker} hasApplied={hasApplied} />;
}
