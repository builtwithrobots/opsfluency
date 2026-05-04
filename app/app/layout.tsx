import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { BottomNav } from "@/components/app/bottom-nav";
import { PreviewBanner } from "@/components/app/preview-banner";
import { ScrollToTopButton } from "@/components/app/scroll-to-top";
import { AuthError, getCompanyContext } from "@/lib/auth/company-context";
import { isCurrentUserSuperAdmin } from "@/lib/auth/super-admin-context";
import type { WorkerLanguage } from "@/lib/types/sop";

/**
 * Wraps every `/app/*` route. The worker PWA pages render their own
 * `<main>` chrome (full-bleed, mobile-first), so this layout stays
 * intentionally thin — auth guard plus a preview banner for staff
 * who aren't actually employees.
 *
 * Routing rules:
 * - No Clerk session → `/sign-in` (the proxy enforces this too, but
 *   keeping it here means the layout never has to handle the
 *   unauthenticated branch in component code).
 * - Session, no `company_members` row, super admin → `/dashboard/platform`.
 *   Super admins have nothing scoped to a tenant in the worker PWA;
 *   bouncing them to the platform console is the only sensible default.
 * - Session, no company, not super admin → `/onboarding`.
 * - Admin or manager (and not impersonating an employee) → render the
 *   preview banner above children. They're allowed to browse `/app`,
 *   but the banner makes it impossible to forget which surface they're
 *   looking at.
 * - Employee → no banner, just the children.
 *
 * When the page is loaded inside an iframe (the `/dashboard/emulator`
 * surface), the banner is suppressed: the parent dashboard already
 * provides "back to dashboard" affordances, and a banner inside the
 * phone frame breaks the illusion the emulator is built on.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  let ctx;
  try {
    ctx = await getCompanyContext();
  } catch (e) {
    if (e instanceof AuthError && e.code === "UNAUTHENTICATED") redirect("/sign-in");
    if (e instanceof AuthError && e.code === "NO_COMPANY") {
      if (await isCurrentUserSuperAdmin()) redirect("/dashboard/platform");
      redirect("/onboarding");
    }
    if (e instanceof AuthError && e.code === "AUTH_BRIDGE_FAILED") redirect("/dashboard");
    throw e;
  }

  // Sec-Fetch-Dest is set by every modern browser on every navigation
  // and resource fetch. `iframe` is the dedicated value for iframe
  // navigations, distinct from `document` (top-level) and `frame`
  // (legacy <frame>, irrelevant here).
  const isEmbedded =
    (await headers()).get("sec-fetch-dest") === "iframe";

  // Bottom nav language follows the worker's persisted preference.
  // Per-page ?lang= overrides are local to the page render and don't
  // reach the layout.
  const { data: member } = await ctx.supabase
    .from("company_members")
    .select("preferred_language")
    .eq("clerk_user_id", ctx.userId)
    .eq("company_id", ctx.company_id)
    .maybeSingle();
  const navLang: WorkerLanguage =
    member?.preferred_language === "es" ? "es" : "en";

  return (
    <>
      {ctx.role === "employee" || isEmbedded ? null : (
        <PreviewBanner role={ctx.role} />
      )}
      {/* Hide scrollbars only when iframed (i.e., inside the emulator).
          Real mobile browsers auto-hide scrollbars already; desktop
          managers browsing /app/* directly should keep them. Touch /
          arrow-key scrolling stays intact either way. */}
      {isEmbedded ? (
        <style>{`
          html, body { scrollbar-width: none; -ms-overflow-style: none; }
          html::-webkit-scrollbar, body::-webkit-scrollbar,
          *::-webkit-scrollbar { display: none; }
          * { scrollbar-width: none; -ms-overflow-style: none; }
        `}</style>
      ) : null}
      {/* Pad the bottom so page content is never hidden behind the nav. */}
      <div className="pb-20">{children}</div>
      <BottomNav lang={navLang} />
      <ScrollToTopButton isEmbedded={isEmbedded} />
    </>
  );
}
