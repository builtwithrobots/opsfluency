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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!anonKey) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");

  // Use supabase-js's native `accessToken` async option instead of setting a
  // one-shot Authorization header. supabase-js calls this on every request,
  // so short-lived Clerk tokens stay fresh. This is the pattern Clerk's
  // Supabase third-party auth docs recommend.
  return createClient(url, anonKey, {
    async accessToken() {
      const { getToken } = await auth();
      return (await getToken()) ?? null;
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
