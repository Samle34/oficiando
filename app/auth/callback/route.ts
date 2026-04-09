import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// Handles the redirect after the user clicks the magic link in their email.
// Supabase appends ?code=... to this URL — we exchange it for a session.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // If a pending profile was stored during registration, save it now
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const pending = cookieStore.get("pending_profile");

      if (pending) {
        try {
          const profile = JSON.parse(pending.value) as { full_name: string; phone: string };
          const { data: { user } } = await supabase.auth.getUser();
          if (user && profile.full_name) {
            await supabase.from("profiles").upsert({
              id: user.id,
              full_name: profile.full_name,
              phone: profile.phone,
            });
          }
        } catch {
          // Malformed cookie — ignore, user can fill profile manually
        }
        cookieStore.delete("pending_profile");
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Exchange failed — redirect to login with error param
  return NextResponse.redirect(`${origin}/login?error=link_invalido`);
}
