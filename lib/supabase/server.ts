import "server-only";

import { auth } from "@clerk/nextjs/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Request-scoped authenticated Supabase client for Server Components,
 * Server Actions, and API routes.
 *
 * RLS is enforced — company isolation runs through the policies seeded
 * alongside every company-scoped table. The Clerk JWT rides along as a
 * Bearer token so Supabase can identify the caller; the `x-clerk-user-id`
 * header is a second signal that Phase 5's `requesting_company_id()`
 * helper may read via a PostgREST pre-request hook.
 */
export async function getRequestClient(
  clerkUserId: string,
): Promise<SupabaseClient> {
  const { getToken } = await auth();
  const token = await getToken();

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "x-clerk-user-id": clerkUserId,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}
