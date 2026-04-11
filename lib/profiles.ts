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
  client_rating: number;
  client_rating_count: number;
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

export interface RatingWithReviewer extends Rating {
  reviewer_name: string | null;
}

export async function getRatingsByWorkerId(
  workerId: string,
  limit = 10
): Promise<RatingWithReviewer[]> {
  const supabase = await createServerSupabaseClient();
  const { data: ratings } = await supabase
    .from("ratings")
    .select("*")
    .eq("worker_id", workerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!ratings || ratings.length === 0) return [];

  const clientIds = [...new Set(ratings.map((r) => r.client_id as string))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", clientIds);

  const nameMap = new Map((profiles ?? []).map((p) => [p.id as string, p.full_name as string | null]));

  return ratings.map((r) => ({
    ...(r as Rating),
    reviewer_name: nameMap.get(r.client_id as string) ?? null,
  }));
}

export interface ClientRating {
  id: number;
  job_id: number;
  worker_id: string;
  client_id: string;
  score: number;
  comment: string | null;
  created_at: string;
  reviewer_name: string | null;
}

export async function getClientRatingsByClientId(
  clientId: string,
  limit = 10
): Promise<ClientRating[]> {
  const supabase = await createServerSupabaseClient();
  const { data: ratings } = await supabase
    .from("client_ratings")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!ratings || ratings.length === 0) return [];

  const workerIds = [...new Set(ratings.map((r) => r.worker_id as string))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", workerIds);

  const nameMap = new Map((profiles ?? []).map((p) => [p.id as string, p.full_name as string | null]));

  return ratings.map((r) => ({
    id: r.id as number,
    job_id: r.job_id as number,
    worker_id: r.worker_id as string,
    client_id: r.client_id as string,
    score: r.score as number,
    comment: r.comment as string | null,
    created_at: r.created_at as string,
    reviewer_name: nameMap.get(r.worker_id as string) ?? null,
  }));
}
