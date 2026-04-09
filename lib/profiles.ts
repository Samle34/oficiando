import { createServerSupabaseClient } from "./supabase";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  nationality: string | null;
  province: string | null;
  role: "client" | "worker";
  avatar_url: string | null;
  bio: string | null;
  categories: string[];
  work_zones: string[];
  rating: number;
  rating_count: number;
}

export interface PortfolioItem {
  id: number;
  worker_id: string;
  title: string;
  description: string | null;
  photos: string[];
  created_at: string;
}

export interface Rating {
  id: number;
  job_id: number;
  worker_id: string;
  client_id: string;
  score: number;
  comment: string | null;
  created_at: string;
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  return data as Profile | null;
}

export async function getPortfolioByWorkerId(
  workerId: string
): Promise<PortfolioItem[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("worker_id", workerId)
    .order("created_at", { ascending: false });
  return (data ?? []) as PortfolioItem[];
}

export async function getRatingsByWorkerId(
  workerId: string,
  limit = 10
): Promise<Rating[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("ratings")
    .select("*")
    .eq("worker_id", workerId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Rating[];
}
