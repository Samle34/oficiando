import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase";

export default async function Header() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

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
          <Link
            href="/perfil"
            className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold"
          >
            {(user.email?.[0] ?? "U").toUpperCase()}
          </Link>
        ) : (
          <Link
            href="/login"
            className="text-sm font-semibold text-brand"
          >
            Ingresar
          </Link>
        )}
      </div>
    </header>
  );
}
