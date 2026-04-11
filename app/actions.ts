"use server";

import { revalidatePath } from "next/cache";
import { createJob, type CreateJobInput } from "@/lib/jobs";
import { createServerSupabaseClient } from "@/lib/supabase";
import type { PortfolioItem } from "@/lib/profiles";

export type PublicarState =
  | { status: "idle" }
  | { status: "success"; jobId: number }
  | { status: "error"; message: string };

export async function publicarTrabajo(
  input: Omit<CreateJobInput, "client_name" | "client_phone">
): Promise<PublicarState> {
  if (!input.title?.trim()) {
    return { status: "error", message: "El título es obligatorio." };
  }
  if (!input.category_id) {
    return { status: "error", message: "La categoría es obligatoria." };
  }
  if (!input.province?.trim() || !input.city?.trim()) {
    return { status: "error", message: "La ubicación es obligatoria." };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    let client_name: string | undefined;
    let client_phone: string | undefined;
    let user_id: string | undefined;

    if (user) {
      user_id = user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .single();
      client_name = profile?.full_name ?? undefined;
      client_phone = profile?.phone ?? undefined;

      if (!client_phone?.trim()) {
        return {
          status: "error",
          message: "Completá tu número de teléfono en el perfil antes de publicar, así los trabajadores pueden contactarte.",
        };
      }
    }

    const job = await createJob({ ...input, client_name, client_phone, user_id } as CreateJobInput);

    revalidatePath("/mis-proyectos");
    revalidatePath("/trabajos");

    return { status: "success", jobId: job.id };
  } catch {
    return {
      status: "error",
      message: "No se pudo publicar el trabajo. Intentá de nuevo.",
    };
  }
}

export type CloseJobState =
  | { status: "success" }
  | { status: "error"; message: string };

export async function closeJob(jobId: number): Promise<CloseJobState> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "No autenticado." };
  }

  const { error } = await supabase
    .from("jobs")
    .update({ status: "cerrado" })
    .eq("id", jobId)
    .eq("user_id", user.id); // RLS + double-check: only owner can close

  if (error) {
    return { status: "error", message: "No se pudo cerrar el trabajo." };
  }

  revalidatePath("/mis-proyectos");
  revalidatePath(`/trabajos/${jobId}`);
  revalidatePath("/trabajos");

  return { status: "success" };
}

// ─── Worker search (legacy, kept for reference) ───────────────────

export type WorkerCandidate = {
  id: string;
  full_name: string;
  avatar_url: string | null;
};

// ─── Accepted workers for rating ─────────────────────────────────

export type AcceptedWorkerForRating = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  alreadyRated: boolean;
};

export async function getAcceptedWorkersForJob(
  jobId: number
): Promise<AcceptedWorkerForRating[]> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Verify ownership
  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .single();
  if (!job) return [];

  // Accepted applications
  const { data: apps } = await supabase
    .from("applications")
    .select("worker_id")
    .eq("job_id", jobId)
    .eq("status", "accepted");
  if (!apps || apps.length === 0) return [];

  const workerIds = apps.map((a) => a.worker_id as string);

  // Profiles of those workers
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", workerIds);

  // Existing ratings for this job
  const { data: existingRatings } = await supabase
    .from("ratings")
    .select("worker_id")
    .eq("job_id", jobId);

  const ratedSet = new Set((existingRatings ?? []).map((r) => r.worker_id as string));

  return (profiles ?? []).map((p) => ({
    id: p.id as string,
    full_name: (p.full_name ?? "Trabajador") as string,
    avatar_url: p.avatar_url as string | null,
    alreadyRated: ratedSet.has(p.id as string),
  }));
}

// ─── Rating ───────────────────────────────────────────────────────

export type RateWorkerState =
  | { status: "success" }
  | { status: "error"; message: string };

export async function rateWorker(input: {
  jobId: number;
  workerId: string;
  score: number;
  comment?: string;
}): Promise<RateWorkerState> {
  if (input.score < 1 || input.score > 5) {
    return { status: "error", message: "La puntuación debe ser entre 1 y 5." };
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  // Verify the job belongs to this user and is closed
  const { data: job } = await supabase
    .from("jobs")
    .select("id, status, user_id")
    .eq("id", input.jobId)
    .eq("user_id", user.id)
    .single();

  if (!job) return { status: "error", message: "Trabajo no encontrado." };
  if (job.status !== "cerrado") return { status: "error", message: "Solo podés calificar trabajos cerrados." };

  const { error } = await supabase.from("ratings").insert({
    job_id: input.jobId,
    worker_id: input.workerId,
    client_id: user.id,
    score: input.score,
    comment: input.comment?.trim() || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { status: "error", message: "Ya calificaste a este trabajador para este trabajo." };
    }
    return { status: "error", message: "No se pudo guardar la calificación." };
  }

  return { status: "success" };
}

// ─── Portfolio ────────────────────────────────────────────────────

export async function addPortfolioItem(input: {
  title: string;
  description?: string;
  photos: string[];
}): Promise<{ error?: string; item?: PortfolioItem }> {
  if (!input.title?.trim()) return { error: "El título es obligatorio." };
  if (input.photos.length > 3) return { error: "Máximo 3 fotos por item." };

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  // Verify role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "worker") return { error: "Solo los trabajadores pueden agregar portfolio." };

  // Limit total items to 10
  const { count } = await supabase
    .from("portfolio_items")
    .select("id", { count: "exact", head: true })
    .eq("worker_id", user.id);

  if ((count ?? 0) >= 10) return { error: "Límite de 10 trabajos en el portfolio." };

  const { data, error } = await supabase
    .from("portfolio_items")
    .insert({
      worker_id: user.id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      photos: input.photos,
    })
    .select()
    .single();

  if (error) return { error: "No se pudo guardar el item." };
  return { item: data as PortfolioItem };
}

export async function deletePortfolioItem(
  itemId: number
): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase
    .from("portfolio_items")
    .delete()
    .eq("id", itemId)
    .eq("worker_id", user.id); // RLS + double-check

  if (error) return { error: "No se pudo eliminar el item." };
  return {};
}

// ─── Applications ─────────────────────────────────────────────────

export type ApplyState =
  | { status: "success" }
  | { status: "error"; message: string };

export async function applyToJob(jobId: number, message?: string): Promise<ApplyState> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Debés iniciar sesión." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "worker") {
    return { status: "error", message: "Solo los trabajadores pueden postularse." };
  }

  const { error } = await supabase
    .from("applications")
    .upsert({ job_id: jobId, worker_id: user.id, message: message?.trim() || null, status: "pending" });

  if (error) return { status: "error", message: "No se pudo guardar la postulación." };

  revalidatePath(`/trabajos/${jobId}`);
  revalidatePath("/mis-trabajos");

  return { status: "success" };
}

// ─── Rate client (worker → client) ───────────────────────────────

export type RateClientState =
  | { status: "success" }
  | { status: "error"; message: string };

export async function rateClient(input: {
  jobId: number;
  clientId: string;
  score: number;
  comment?: string;
}): Promise<RateClientState> {
  if (input.score < 1 || input.score > 5) {
    return { status: "error", message: "La puntuación debe ser entre 1 y 5." };
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  // Verify this worker was accepted on this job
  const { data: app } = await supabase
    .from("applications")
    .select("status")
    .eq("job_id", input.jobId)
    .eq("worker_id", user.id)
    .single();

  if (!app || app.status !== "accepted") {
    return { status: "error", message: "Solo podés calificar clientes de trabajos en los que fuiste aceptado." };
  }

  // Verify job is closed
  const { data: job } = await supabase
    .from("jobs")
    .select("status")
    .eq("id", input.jobId)
    .single();

  if (!job || job.status !== "cerrado") {
    return { status: "error", message: "Solo podés calificar en trabajos cerrados." };
  }

  const { error } = await supabase.from("client_ratings").insert({
    job_id: input.jobId,
    worker_id: user.id,
    client_id: input.clientId,
    score: input.score,
    comment: input.comment?.trim() || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { status: "error", message: "Ya calificaste al cliente de este trabajo." };
    }
    return { status: "error", message: "No se pudo guardar la calificación." };
  }

  revalidatePath("/mis-trabajos");
  return { status: "success" };
}

export type AcceptApplicationState =
  | { status: "success" }
  | { status: "error"; message: string };

export async function acceptApplication(jobId: number, workerId: string): Promise<AcceptApplicationState> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  // Verify the job belongs to this user
  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .single();

  if (!job) return { status: "error", message: "No autorizado." };

  const { error } = await supabase
    .from("applications")
    .update({ status: "accepted" })
    .eq("job_id", jobId)
    .eq("worker_id", workerId);

  if (error) return { status: "error", message: "No se pudo aceptar la postulación." };

  revalidatePath(`/trabajos/${jobId}`);
  revalidatePath("/mis-trabajos");

  return { status: "success" };
}
