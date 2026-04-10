import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// Dedicated callback for password recovery links.
// Supabase sends either ?code= (PKCE) or ?token_hash=&type=recovery (OTP).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");

  const supabase = await createServerSupabaseClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/nueva-contrasena`);
  } else if (token_hash) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: "recovery" });
    if (!error) return NextResponse.redirect(`${origin}/nueva-contrasena`);
  }

  return NextResponse.redirect(`${origin}/login?error=link_invalido`);
}
