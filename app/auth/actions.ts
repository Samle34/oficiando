"use server";

import { createServerSupabaseClient } from "@/lib/supabase";
import { headers } from "next/headers";

export type AuthState =
  | { status: "idle" }
  | { status: "success"; email: string }
  | { status: "error"; message: string };

export type RegisterState =
  | { status: "idle" }
  | { status: "success"; needsEmailConfirm: boolean }
  | { status: "error"; message: string };

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<AuthState> {
  if (!email?.trim() || !password) {
    return { status: "error", message: "Completá todos los campos." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    return { status: "error", message: "Email o contraseña incorrectos." };
  }

  return { status: "success", email };
}

export async function registerWithProfile(data: {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  nationality: string;
  province: string;
}): Promise<RegisterState> {
  if (!data.full_name?.trim())
    return { status: "error", message: "El nombre es obligatorio." };
  if (!data.phone?.trim())
    return { status: "error", message: "El teléfono es obligatorio." };
  if (!data.nationality?.trim())
    return { status: "error", message: "La nacionalidad es obligatoria." };
  if (!data.province?.trim())
    return { status: "error", message: "La provincia es obligatoria." };
  if (!data.password || data.password.length < 6)
    return { status: "error", message: "La contraseña debe tener al menos 6 caracteres." };

  const supabase = await createServerSupabaseClient();
  const headersList = await headers();
  const origin = headersList.get("origin") ?? "";

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email.trim().toLowerCase(),
    password: data.password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already registered") || msg.includes("user already registered")) {
      return { status: "error", message: "Este email ya está registrado. Iniciá sesión." };
    }
    if (error.status === 429 || msg.includes("rate limit")) {
      return { status: "error", message: "Demasiados intentos. Esperá unos minutos y volvé a intentar." };
    }
    return { status: "error", message: "No se pudo crear la cuenta. Intentá de nuevo." };
  }

  const profile = {
    full_name: data.full_name.trim(),
    phone: data.phone.trim(),
    nationality: data.nationality.trim(),
    province: data.province.trim(),
  };

  if (authData.session && authData.user) {
    // Email confirmation is OFF — session is active, save profile now
    await supabase.from("profiles").upsert({ id: authData.user.id, ...profile });
    return { status: "success", needsEmailConfirm: false };
  } else {
    // Email confirmation is ON — store profile in cookie for callback
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    cookieStore.set("pending_profile", JSON.stringify(profile), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 600,
      path: "/",
    });
    return { status: "success", needsEmailConfirm: true };
  }
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
