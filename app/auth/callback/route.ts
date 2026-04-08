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
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Exchange failed — redirect to login with error param
  return NextResponse.redirect(`${origin}/login?error=link_invalido`);
}
