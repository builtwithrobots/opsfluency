import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Routes that require a Clerk session. Everything else is public —
 * explicitly including `/sign-in`, `/sign-up`, `/pair-monitor`,
 * `/monitor/[id]` (authenticated by signed `opsf_monitor` cookie), and
 * `/s/[qr_code_id]` (QR scan landing that redirects through sign-in when
 * needed). See `CLAUDE.md` → "Auth proxy (proxy.ts)".
 */
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/app(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
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
