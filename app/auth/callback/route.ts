import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// Handles the redirect after the user clicks the confirmation link in their email.
// Supabase may use either PKCE (?code=...) or email OTP (?token_hash=...&type=...).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as "signup" | "recovery" | "email" | null;
  const next = searchParams.get("next") ?? "/";

  const supabase = await createServerSupabaseClient();
  let sessionError = true;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) sessionError = false;
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) sessionError = false;
  }

  if (!sessionError) {
    // Password recovery — send directly to the new password page
    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/nueva-contrasena`);
    }

    // If a pending profile was stored during registration, save it now
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const pending = cookieStore.get("pending_profile");

    if (pending) {
      try {
        const profile = JSON.parse(pending.value) as {
          full_name: string;
          phone: string;
          nationality?: string;
          province?: string;
          role?: "client" | "worker";
        };
        const { data: { user } } = await supabase.auth.getUser();
        if (user && profile.full_name) {
          await supabase.from("profiles").upsert({
            id: user.id,
            full_name: profile.full_name,
            phone: profile.phone,
            nationality: profile.nationality ?? null,
            province: profile.province ?? null,
            role: profile.role ?? "client",
          });
        }
      } catch {
        // Malformed cookie — ignore, user can fill profile manually
      }
      cookieStore.delete("pending_profile");
    }

    return NextResponse.redirect(`${origin}${next}`);
  }

  // Exchange failed — redirect to login with error param
  return NextResponse.redirect(`${origin}/login?error=link_invalido`);
}
