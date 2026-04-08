"use server";

import { createServerSupabaseClient } from "@/lib/supabase";
import { headers } from "next/headers";

export type AuthState =
  | { status: "idle" }
  | { status: "success"; email: string }
  | { status: "error"; message: string };

export async function sendMagicLink(email: string): Promise<AuthState> {
  if (!email?.trim()) {
    return { status: "error", message: "El email es obligatorio." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { status: "error", message: "El email no es válido." };
  }

  const supabase = await createServerSupabaseClient();
  const headersList = await headers();
  const origin = headersList.get("origin") ?? "";

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { status: "error", message: "No se pudo enviar el email. Intentá de nuevo." };
  }

  return { status: "success", email: email.trim().toLowerCase() };
}

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
}

export async function updateProfile(data: {
  full_name: string;
  phone: string;
}): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { error: "No autenticado." };

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, full_name: data.full_name.trim(), phone: data.phone.trim() });

  if (error) return { error: "No se pudo guardar el perfil." };
  return {};
}
