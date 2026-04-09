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

// ─── Worker search ────────────────────────────────────────────────

export type WorkerCandidate = {
  id: string;
  full_name: string;
  avatar_url: string | null;
};

export async function searchWorkers(name: string): Promise<WorkerCandidate[]> {
  if (!name || name.trim().length < 2) return [];

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("role", "worker")
    .ilike("full_name", `%${name.trim()}%`)
    .limit(5);

  return (data ?? []) as WorkerCandidate[];
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
