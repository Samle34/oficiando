// Storage helpers — import only from Client Components ("use client")
// Server Actions should never handle file uploads directly;
// the browser uploads to Supabase Storage and passes the public URL.

import { createBrowserSupabaseClient } from "./supabase";

export type StorageBucket = "avatars" | "job-photos" | "portfolio";

/**
 * Generates a unique file name to avoid cache collisions.
 * Format: "{userId}-{timestamp}-{random}.{ext}"
 */
export function generateFileName(userId: string, file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 7);
  return `${userId}-${ts}-${rand}.${ext}`;
}

/**
 * Uploads a file to the given bucket and returns its public URL.
 * @param bucket  - Storage bucket name
 * @param path    - Full path inside the bucket, e.g. "{userId}/avatar.jpg"
 * @param file    - File object from the browser
 * @param upsert  - Whether to overwrite an existing file (default: false)
 */
export async function uploadFile(
  bucket: StorageBucket,
  path: string,
  file: File,
  upsert = false
): Promise<string> {
  const supabase = createBrowserSupabaseClient();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert, cacheControl: "3600" });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Deletes a file from Storage given its full public URL.
 * Extracts the path from the URL automatically.
 */
export async function deleteFileByUrl(
  bucket: StorageBucket,
  publicUrl: string
): Promise<void> {
  const supabase = createBrowserSupabaseClient();

  // Extract path: everything after "/storage/v1/object/public/{bucket}/"
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return; // not a storage URL, skip

  const path = decodeURIComponent(publicUrl.slice(idx + marker.length));
  await supabase.storage.from(bucket).remove([path]);
}
