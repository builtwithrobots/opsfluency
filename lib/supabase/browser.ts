import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Anon Supabase client for `"use client"` components. RLS-enforced via the
 * anon role. No elevated permissions; reads are scoped by the same
 * `<table>_company_isolation` policies that guard server-side access.
 */
let client: SupabaseClient | null = null;

export function getBrowserClient(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return client;
}
