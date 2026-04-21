import { NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";

import { getAdminClient } from "@/lib/supabase/admin";
import { getRequestClient } from "@/lib/supabase/server";

/**
 * Diagnostic route for the Clerk ↔ Supabase JWT bridge.
 *
 * Returns every signal needed to figure out why RLS-authenticated reads
 * aren't seeing rows that the service-role client can see:
 *
 * - `clerk.userId`             — whether Clerk resolves a session server-side
 * - `token.present` / preview  — whether `getToken()` returns a JWT
 * - `token.claims`             — decoded `iss`, `sub`, `aud`, `exp`
 * - `jwtQuery`                 — `company_members` rows visible via RLS
 * - `adminQuery`               — `company_members` rows visible via service role
 * - `config.supabaseUrl`       — sanity-check which project the app points at
 *
 * Hit it from the browser while signed in:
 *   `${NEXT_PUBLIC_APP_URL}/api/debug/auth-bridge`
 *
 * Gated to signed-in users only. No secrets are leaked — the token preview
 * is the first/last 8 chars so `iss` / `aud` can be verified against the
 * Supabase Third-party Auth config without exposing the full JWT.
 *
 * Delete this route once the bridge is green in prod. It's kept deliberately
 * simple so security review is trivial.
 */
export async function GET() {
  const { userId, getToken } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in first, then hit this route." } },
      { status: 401 },
    );
  }

  const token = await getToken().catch((e: unknown) => {
    return { __error: e instanceof Error ? e.message : String(e) } as const;
  });

  const tokenString = typeof token === "string" ? token : null;
  const tokenError =
    token && typeof token === "object" && "__error" in token ? token.__error : null;

  const claims = tokenString ? decodeJwtClaims(tokenString) : null;

  // Query 1: through the user's Clerk JWT (RLS-enforced).
  let jwtRows: unknown[] | null = null;
  let jwtError: string | null = null;
  try {
    const userClient = await getRequestClient();
    const { data, error } = await userClient
      .from("company_members")
      .select("id, company_id, role, created_at")
      .eq("clerk_user_id", userId);
    if (error) jwtError = `${error.code ?? ""} ${error.message}`.trim();
    else jwtRows = data ?? [];
  } catch (e) {
    jwtError = e instanceof Error ? e.message : String(e);
  }

  // Query 2: service-role (bypasses RLS). Ground truth.
  let adminRows: unknown[] | null = null;
  let adminError: string | null = null;
  try {
    const admin = getAdminClient();
    const { data, error } = await admin
      .from("company_members")
      .select("id, company_id, role, created_at")
      .eq("clerk_user_id", userId);
    if (error) adminError = `${error.code ?? ""} ${error.message}`.trim();
    else adminRows = data ?? [];
  } catch (e) {
    adminError = e instanceof Error ? e.message : String(e);
  }

  const diagnosis = diagnose({
    hasToken: Boolean(tokenString),
    tokenError,
    claims,
    jwtRowCount: jwtRows?.length ?? 0,
    adminRowCount: adminRows?.length ?? 0,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
  });

  return NextResponse.json({
    clerk: { userId },
    token: {
      present: Boolean(tokenString),
      length: tokenString?.length ?? 0,
      preview: tokenString
        ? `${tokenString.slice(0, 8)}…${tokenString.slice(-8)}`
        : null,
      error: tokenError,
      claims,
    },
    jwtQuery: {
      rowCount: jwtRows?.length ?? 0,
      rows: jwtRows,
      error: jwtError,
    },
    adminQuery: {
      rowCount: adminRows?.length ?? 0,
      rows: adminRows,
      error: adminError,
    },
    config: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
      appUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
      clerkFrontendApiUrl: process.env.NEXT_PUBLIC_CLERK_FRONTEND_API_URL ?? null,
    },
    diagnosis,
  });
}

function decodeJwtClaims(jwt: string): Record<string, unknown> | { __error: string } {
  const parts = jwt.split(".");
  if (parts.length !== 3) return { __error: "not a JWT (expected 3 segments)" };
  try {
    const payload = Buffer.from(
      parts[1].replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf8");
    return JSON.parse(payload) as Record<string, unknown>;
  } catch (e) {
    return { __error: e instanceof Error ? e.message : String(e) };
  }
}

function diagnose(input: {
  hasToken: boolean;
  tokenError: string | null;
  claims: Record<string, unknown> | { __error: string } | null;
  jwtRowCount: number;
  adminRowCount: number;
  supabaseUrl: string | null;
}): { verdict: string; fix: string } {
  if (!input.hasToken) {
    return {
      verdict: "Clerk getToken() returned no token.",
      fix: input.tokenError
        ? `Server-side error from Clerk: ${input.tokenError}. Check CLERK_SECRET_KEY matches the same Clerk instance as NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.`
        : "Usually means this request has no active Clerk session cookie, or CLERK_SECRET_KEY is missing/wrong.",
    };
  }

  if (input.claims && "__error" in input.claims) {
    return {
      verdict: `JWT could not be decoded: ${input.claims.__error}`,
      fix: "This is a bug in Clerk or in this diagnostic. Share the token preview with support.",
    };
  }

  const iss = input.claims && typeof input.claims === "object" ? input.claims["iss"] : undefined;

  if (input.adminRowCount === 0) {
    return {
      verdict: "No company_members row exists for this user even via service role.",
      fix: "Onboarding has never successfully written a row for this user. Submit the onboarding form again.",
    };
  }

  if (input.jwtRowCount > 0) {
    return {
      verdict: "Bridge is working. RLS reads succeed.",
      fix: "Nothing to fix. If the dashboard still errors, share the JSON — it's a different bug.",
    };
  }

  return {
    verdict: `JWT present (iss=${String(iss)}) but RLS returned 0 rows while service role returned ${input.adminRowCount}.`,
    fix: `Supabase is not trusting this JWT. In Supabase → Auth → Sign In / Providers → Third-party Auth → Clerk, the Domain must equal the JWT's iss exactly: "${String(iss)}". If the configured Domain doesn't match, delete the provider, re-add with that exact value, and retry. Also verify SUPABASE_URL in Vercel (${input.supabaseUrl}) points at the SAME Supabase project whose dashboard you edited.`,
  };
}
