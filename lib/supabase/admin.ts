import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses RLS.
 *
 * Reserved for: migrations, the default-department seed on company creation,
 * cron jobs, and cross-tenant analytics. Every import site must justify
 * inline why RLS bypass is required — treat each usage as a security-review
 * -worthy line.
 */
let client: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
  }
  return client;
}
