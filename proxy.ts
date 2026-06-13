import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Routes that require a Clerk session. Everything else is public —
 * explicitly including `/sign-in`, `/sign-up`, `/pair-monitor`,
 * `/monitor/[id]` (authenticated by signed `opsf_monitor` cookie), and
 * `/s/[qr_code_id]` (QR scan landing that redirects through sign-in when
 * needed). See `CLAUDE.md` → "Auth proxy (proxy.ts)".
 *
 * `/onboarding` is protected too — it's the first-admin company-bootstrap
 * screen and needs a Clerk session to resolve `userId` before the
 * `bootstrap_company` RPC can attach the new member row.
 *
 * `/dashboard/platform/*` is super-admin only; the session check happens
 * here, and authorization against the `super_admins` allowlist happens
 * in `app/dashboard/platform/layout.tsx` via `getSuperAdminContext()`.
 */
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/app(.*)",
  "/onboarding(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // On the app subdomain, redirect / to /sign-in so visitors land in the
  // auth flow instead of the consultancy marketing homepage.
  // Signed-in users are bounced from /sign-in → /dashboard by Clerk automatically
  // (NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/dashboard).
  const host = req.headers.get("host") ?? "";
  if (host.startsWith("app.") && req.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
