import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import {
  getPortfolioByWorkerId,
  getRatingsByWorkerId,
  getClientRatingsByClientId,
} from "@/lib/profiles";
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
    .select("full_name, phone, role, avatar_url, bio, categories, work_zones, rating, rating_count, client_rating, client_rating_count")
    .eq("id", user.id)
    .single();

  const role = (profile?.role ?? "client") as "client" | "worker";

  const [portfolioItems, workerReviews, clientReviews] = await Promise.all([
    role === "worker" ? getPortfolioByWorkerId(user.id) : Promise.resolve([]),
    role === "worker" ? getRatingsByWorkerId(user.id) : Promise.resolve([]),
    role === "client" ? getClientRatingsByClientId(user.id) : Promise.resolve([]),
  ]);

  return (
    <PerfilClient
      email={user.email ?? ""}
      fullName={profile?.full_name ?? ""}
      phone={profile?.phone ?? ""}
      role={role}
      avatarUrl={profile?.avatar_url ?? null}
      bio={profile?.bio ?? null}
      categories={(profile?.categories as string[]) ?? []}
      workZones={(profile?.work_zones as string[]) ?? []}
      rating={profile?.rating ?? 0}
      ratingCount={profile?.rating_count ?? 0}
      clientRating={profile?.client_rating ?? 0}
      clientRatingCount={profile?.client_rating_count ?? 0}
      portfolioItems={portfolioItems}
      workerReviews={workerReviews}
      clientReviews={clientReviews}
    />
  );
}
