import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";

import { getAdminClient } from "@/lib/supabase/admin";
import { getRequestClient } from "@/lib/supabase/server";

/**
 * Diagnostic route for the Clerk ↔ Supabase JWT bridge.
 *
 * Always returns 200 with everything we can learn about the current request:
 *
 * - `request.host` / `origin`        — which origin the caller is hitting
 * - `cookies.clerkPresent`           — whether a `__session` / `__clerk_*`
 *                                      cookie is attached (redacted)
 * - `clerk.userId`                   — server-side `auth()` result
 * - `token.*`                        — `getToken()` result + decoded claims
 * - `jwtQuery` / `adminQuery`        — `company_members` rows via RLS vs admin
 *                                      for the current Clerk user (or a
 *                                      `?userId=user_xxx` fallback for when
 *                                      `auth()` can't resolve a session)
 *
 * The token itself is never echoed — only a first-8/last-8 preview.
 *
 * Delete once the prod bridge is green. Keep simple so security review is
 * trivial.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const fallbackUserId = url.searchParams.get("userId");

  const headerStore = await headers();
  const cookieStore = await cookies();

  const host = headerStore.get("host");
  const origin = headerStore.get("origin");
  const referer = headerStore.get("referer");
  const forwardedHost = headerStore.get("x-forwarded-host");
  const forwardedProto = headerStore.get("x-forwarded-proto");

  const allCookieNames = cookieStore.getAll().map((c) => c.name);
  const clerkCookieNames = allCookieNames.filter(
    (n) => n.startsWith("__session") || n.startsWith("__clerk") || n === "__client_uat",
  );

  let clerkAuth: { userId: string | null; error: string | null; getToken: (() => Promise<string | null>) | null } = {
    userId: null,
    error: null,
    getToken: null,
  };
  try {
    const a = await auth();
    clerkAuth = {
      userId: a.userId ?? null,
      error: null,
      getToken: a.getToken as () => Promise<string | null>,
    };
  } catch (e) {
    clerkAuth.error = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  }

  let tokenString: string | null = null;
  let tokenError: string | null = null;
  if (clerkAuth.getToken) {
    try {
      tokenString = (await clerkAuth.getToken()) ?? null;
    } catch (e) {
      tokenError = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    }
  }

  const claims = tokenString ? decodeJwtClaims(tokenString) : null;

  const effectiveUserId = clerkAuth.userId ?? fallbackUserId;

  let jwtRows: unknown[] | null = null;
  let jwtError: string | null = null;
  if (effectiveUserId) {
    try {
      const userClient = await getRequestClient();
      const { data, error } = await userClient
        .from("company_members")
        .select("id, company_id, role, created_at")
        .eq("clerk_user_id", effectiveUserId);
      if (error) jwtError = `${error.code ?? ""} ${error.message}`.trim();
      else jwtRows = data ?? [];
    } catch (e) {
      jwtError = e instanceof Error ? e.message : String(e);
    }
  }

  let adminRows: unknown[] | null = null;
  let adminError: string | null = null;
  if (effectiveUserId) {
    try {
      const admin = getAdminClient();
      const { data, error } = await admin
        .from("company_members")
        .select("id, company_id, role, clerk_user_id, created_at")
        .eq("clerk_user_id", effectiveUserId);
      if (error) adminError = `${error.code ?? ""} ${error.message}`.trim();
      else adminRows = data ?? [];
    } catch (e) {
      adminError = e instanceof Error ? e.message : String(e);
    }
  }

  // Call debug_whoami() via the JWT client to see what Postgres thinks the
  // current session role/user is. If `auth_role` comes back as 'anon' while
  // the token above is valid, Supabase isn't accepting the JWT at all
  // (usually because PostgREST couldn't fetch JWKS from the issuer).
  let whoami: unknown = null;
  let whoamiError: string | null = null;
  try {
    const userClient = await getRequestClient();
    const { data, error } = await userClient.rpc("debug_whoami");
    if (error) whoamiError = `${error.code ?? ""} ${error.message}`.trim();
    else whoami = Array.isArray(data) ? data[0] : data;
  } catch (e) {
    whoamiError = e instanceof Error ? e.message : String(e);
  }

  // Try to fetch the JWKS from the Clerk issuer. Supabase fetches this to
  // validate JWT signatures — if it's unreachable or returns an error
  // status, every third-party JWT from that issuer is rejected.
  const iss =
    claims && typeof claims === "object" && !("__error" in claims)
      ? (claims["iss"] as string | undefined)
      : undefined;
  let jwksProbe: {
    url: string;
    status: number | null;
    ok: boolean;
    keyCount: number | null;
    error: string | null;
  } | null = null;
  if (iss) {
    const jwksUrl = `${iss.replace(/\/$/, "")}/.well-known/jwks.json`;
    try {
      const resp = await fetch(jwksUrl, { cache: "no-store" });
      let keyCount: number | null = null;
      if (resp.ok) {
        try {
          const json = (await resp.json()) as { keys?: unknown[] };
          keyCount = Array.isArray(json.keys) ? json.keys.length : null;
        } catch {
          keyCount = null;
        }
      }
      jwksProbe = {
        url: jwksUrl,
        status: resp.status,
        ok: resp.ok,
        keyCount,
        error: null,
      };
    } catch (e) {
      jwksProbe = {
        url: jwksUrl,
        status: null,
        ok: false,
        keyCount: null,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  // Also count all company_members and companies rows for a sanity check —
  // useful when the current user genuinely has no row but others do.
  let totalMembers: number | null = null;
  let totalCompanies: number | null = null;
  let distinctClerkUserIds: string[] | null = null;
  try {
    const admin = getAdminClient();
    const [membersCount, companiesCount, distinctIds] = await Promise.all([
      admin.from("company_members").select("id", { count: "exact", head: true }),
      admin.from("companies").select("id", { count: "exact", head: true }),
      admin.from("company_members").select("clerk_user_id"),
    ]);
    totalMembers = membersCount.count ?? null;
    totalCompanies = companiesCount.count ?? null;
    distinctClerkUserIds = Array.from(
      new Set((distinctIds.data ?? []).map((r: { clerk_user_id: string }) => r.clerk_user_id)),
    );
  } catch {
    // Best-effort.
  }

  const diagnosis = diagnose({
    signedIn: Boolean(clerkAuth.userId),
    clerkError: clerkAuth.error,
    clerkCookiesAttached: clerkCookieNames.length > 0,
    hasToken: Boolean(tokenString),
    tokenError,
    claims,
    jwtRowCount: jwtRows?.length ?? null,
    adminRowCount: adminRows?.length ?? null,
    fallbackUsed: !clerkAuth.userId && Boolean(fallbackUserId),
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
  });

  return NextResponse.json({
    request: {
      host,
      origin,
      referer,
      forwardedHost,
      forwardedProto,
    },
    cookies: {
      total: allCookieNames.length,
      clerkPresent: clerkCookieNames.length > 0,
      clerkCookieNames,
      allCookieNames,
    },
    clerk: {
      userId: clerkAuth.userId,
      error: clerkAuth.error,
      fallbackUserIdFromQuery: fallbackUserId,
    },
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
      rowCount: jwtRows?.length ?? null,
      rows: jwtRows,
      error: jwtError,
    },
    adminQuery: {
      rowCount: adminRows?.length ?? null,
      rows: adminRows,
      error: adminError,
    },
    whoami: {
      result: whoami,
      error: whoamiError,
    },
    jwksProbe,
    db: {
      totalMembers,
      totalCompanies,
      distinctClerkUserIds,
    },
    config: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
      appUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
      clerkFrontendApiUrl: process.env.NEXT_PUBLIC_CLERK_FRONTEND_API_URL ?? null,
      clerkPublishableKeyPrefix:
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.slice(0, 12) ?? null,
      clerkSecretKeyPrefix: process.env.CLERK_SECRET_KEY?.slice(0, 8) ?? null,
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

interface DiagnoseInput {
  signedIn: boolean;
  clerkError: string | null;
  clerkCookiesAttached: boolean;
  hasToken: boolean;
  tokenError: string | null;
  claims: Record<string, unknown> | { __error: string } | null;
  jwtRowCount: number | null;
  adminRowCount: number | null;
  fallbackUsed: boolean;
  supabaseUrl: string | null;
}

function diagnose(input: DiagnoseInput): { verdict: string; fix: string } {
  if (input.clerkError) {
    return {
      verdict: `Clerk auth() threw: ${input.clerkError}`,
      fix: "Usually a missing or misconfigured CLERK_SECRET_KEY, or proxy.ts / clerkMiddleware not running on this route.",
    };
  }

  if (!input.signedIn && !input.clerkCookiesAttached) {
    return {
      verdict: "No Clerk cookies on the request. Server sees you as signed out.",
      fix: "You're hitting this route on a different origin than the one you signed in on. Make sure the URL you're hitting matches the domain where you signed in (check `request.host` above vs the URL bar where you're authenticated). If you use a custom Clerk domain (clerk.opsfluency.com), production sessions are scoped to opsfluency.com — they won't be sent to *.vercel.app preview URLs.",
    };
  }

  if (!input.signedIn && input.clerkCookiesAttached) {
    return {
      verdict: "Clerk cookies are present but auth() couldn't resolve a session.",
      fix: "Possible causes: clerkMiddleware isn't running on this route (check proxy.ts matcher), CLERK_SECRET_KEY / CLERK_PUBLISHABLE_KEY belong to different Clerk instances, or the session cookie was issued by a different Clerk instance than the one these keys point at.",
    };
  }

  if (!input.hasToken) {
    return {
      verdict: "Signed in but getToken() returned null.",
      fix: input.tokenError
        ? `getToken error: ${input.tokenError}`
        : "Could be rate limiting or a transient Clerk backend issue. Retry.",
    };
  }

  if (input.claims && "__error" in input.claims) {
    return {
      verdict: `JWT didn't parse: ${input.claims.__error}`,
      fix: "Share the token preview with support.",
    };
  }

  if ((input.adminRowCount ?? 0) === 0) {
    return {
      verdict: "No company_members row exists for this Clerk user (via admin).",
      fix: "Onboarding has never successfully written a row for this user. Check `db.distinctClerkUserIds` above — compare with `clerk.userId`. If different, you signed up as a different user than you're viewing as.",
    };
  }

  if ((input.jwtRowCount ?? 0) > 0) {
    return {
      verdict: "Bridge is working. RLS reads succeed.",
      fix: "Nothing to fix. If the dashboard still errors, paste the JSON.",
    };
  }

  const iss = input.claims && !("__error" in input.claims) ? input.claims["iss"] : undefined;
  const aud = input.claims && !("__error" in input.claims) ? input.claims["aud"] : undefined;
  return {
    verdict: `JWT present (iss=${JSON.stringify(iss)}, aud=${JSON.stringify(aud)}) but RLS returned 0 rows while admin returned ${input.adminRowCount}. Supabase is rejecting the token.`,
    fix: `The Domain configured in Supabase → Auth → Sign In / Providers → Third-party Auth → Clerk must match the JWT 'iss' claim character-for-character. Most common mismatch: trailing slash, or the Supabase project (${input.supabaseUrl}) you're hitting doesn't match the dashboard you edited.`,
  };
}
