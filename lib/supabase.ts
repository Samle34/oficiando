import { createBrowserClient, createServerClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser singleton — safe to import in Client Components
export function createBrowserSupabaseClient() {
  return createBrowserClient(url, key);
}

// Server client — cookies() is imported dynamically so this module
// can be bundled for the browser without errors (the function itself
// must only be called from server contexts).
export async function createServerSupabaseClient() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component — session refresh handled by proxy.ts
        }
      },
    },
  });
}
