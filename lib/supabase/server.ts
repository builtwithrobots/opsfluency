import "server-only";

import { auth } from "@clerk/nextjs/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Request-scoped authenticated Supabase client for Server Components,
 * Server Actions, and API routes.
 *
 * Clerk issues a JWT per session; Supabase is configured to trust Clerk as
 * a third-party auth provider and validates the token as the Bearer. RLS
 * policies resolve the caller's company by reading `auth.jwt() ->> 'sub'`
 * via the `requesting_company_id()` helper (see the first migration).
 *
 * If the caller has no Clerk session, the client is still returned but
 * without a Bearer token — any RLS-gated query will return empty. Callers
 * should check auth themselves (typically via `getCompanyContext()`) before
 * relying on results.
 */
export async function getRequestClient(): Promise<SupabaseClient> {
  const { getToken } = await auth();
  const token = await getToken();

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}
