import { createServerSupabaseClient } from "./supabase";

// Mirror of the DB schema — snake_case matches Postgres column names exactly
export interface Job {
  id: number;
  title: string;
  description: string | null;
  category_id: string;
  province: string;
  city: string;
  status: "abierto" | "cerrado";
  client_name: string | null;
  client_phone: string | null;
  applicants: number;
  user_id: string | null;
  posted_at: string;
  updated_at: string;
}

// Columns returned in list views — omits client_phone for privacy
const LIST_COLUMNS =
  "id, title, category_id, province, city, status, applicants, posted_at" as const;

// All columns for the detail view
const DETAIL_COLUMNS = "*" as const;

/**
 * Returns all open jobs ordered by most recent.
 * Supports optional category filter and full-text search.
 * Server-side only — uses createServerSupabaseClient.
 */
export async function getJobs({
  category,
  search,
}: {
  category?: string | null;
  search?: string | null;
} = {}): Promise<Job[]> {
  const client = await createServerSupabaseClient();

  let query = client
    .from("jobs")
    .select(LIST_COLUMNS)
    .eq("status", "abierto")
    .order("posted_at", { ascending: false });

  if (category) {
    query = query.eq("category_id", category);
  }

  if (search) {
    // Use full-text search on the generated tsvector column
    // websearch_to_tsquery handles partial words and phrases naturally
    query = query.textSearch("search_vector", search, {
      type: "websearch",
      config: "spanish",
    });
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return (data ?? []) as Job[];
}

/**
 * Returns a single job by ID.
 * Returns null if not found — caller decides how to handle (notFound, etc.)
 */
export async function getJobById(id: number | string): Promise<Job | null> {
  const client = await createServerSupabaseClient();

  const { data, error } = await client
    .from("jobs")
    .select(DETAIL_COLUMNS)
    .eq("id", id)
    .single();

  if (error) {
    // PGRST116 = row not found — not an unexpected error
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  return data as Job;
}

export interface CreateJobInput {
  title: string;
  description?: string;
  category_id: string;
  province: string;
  city: string;
  // Populated from auth profile — nullable for anonymous posts
  client_name?: string;
  client_phone?: string;
  user_id?: string;
}

/**
 * Inserts a new job. Called from a Server Action.
 * user_id and contact fields are null in v1 (populated via auth in Etapa 2).
 */
export async function createJob(input: CreateJobInput): Promise<Job> {
  const client = await createServerSupabaseClient();

  const { data, error } = await client
    .from("jobs")
    .insert({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      category_id: input.category_id,
      province: input.province.trim(),
      city: input.city.trim(),
      client_name: input.client_name?.trim() || null,
      client_phone: input.client_phone?.trim() || null,
      user_id: input.user_id ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Job;
}
