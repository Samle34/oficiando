import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { createServerSupabaseClient } from "@/lib/supabase";
import PerfilClient from "./perfil-client";

export const metadata: Metadata = {
  title: "Mi perfil",
  description: "Tu información y configuración en Oficiando.",
};

export default async function PerfilPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .single();

  return (
    <>
      <Header />
      <PerfilClient
        email={user.email ?? ""}
        fullName={profile?.full_name ?? ""}
        phone={profile?.phone ?? ""}
      />
      <BottomNav />
    </>
  );
}
