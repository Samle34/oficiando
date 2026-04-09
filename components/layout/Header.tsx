import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase";
import Avatar from "@/components/ui/Avatar";

export default async function Header() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let avatarUrl: string | null = null;
  let fullName = "";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();
    avatarUrl = profile?.avatar_url ?? null;
    fullName = profile?.full_name ?? user.email ?? "U";
  }

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="select-none">
          <span className="text-xl font-black tracking-tight text-primary">
            Ofici
          </span>
          <span className="text-xl font-black tracking-tight text-brand">
            ando
          </span>
        </Link>

        {user ? (
          <Link href="/perfil" aria-label="Mi perfil">
            <Avatar name={fullName} avatarUrl={avatarUrl} size="sm" />
          </Link>
        ) : (
          <Link href="/login" className="text-sm font-semibold text-brand">
            Ingresar
          </Link>
        )}
      </div>
    </header>
  );
}
