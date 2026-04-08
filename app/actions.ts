"use server";

import { revalidatePath } from "next/cache";
import { createJob, type CreateJobInput } from "@/lib/jobs";
import { createServerSupabaseClient } from "@/lib/supabase";

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
