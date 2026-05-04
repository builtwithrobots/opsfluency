import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/dashboard/app-shell";
import { AuthBridgeError } from "@/components/dashboard/auth-bridge-error";
import { ImpersonationBanner } from "@/components/dashboard/impersonation-banner";
import type { SetupPrompt, Viewer } from "@/components/dashboard/nav-config";
import { AuthError, getCompanyContext } from "@/lib/auth/company-context";
import { isCurrentUserSuperAdmin } from "@/lib/auth/super-admin-context";

interface Resolved {
  viewer: Viewer;
  impersonatingCompanyName?: string;
}

type ResolveResult =
  | { kind: "viewer"; resolved: Resolved }
  | { kind: "bridgeError"; detail?: string }
  | { kind: "deactivated" };

async function resolveViewer(): Promise<ResolveResult> {
  try {
    const ctx = await getCompanyContext();

    // Employees don't belong in the manager dashboard. Skip this
    // redirect when impersonating so super admins can never get bounced
    // out mid-session — impersonation always forces role='admin' anyway.
    if (ctx.role === "employee" && !ctx.impersonating) redirect("/app/home");

    // Managers must have at least one department assigned before they can
    // use the dashboard. Admins are unrestricted; impersonation bypasses.
    if (ctx.role === "manager" && !ctx.impersonating) {
      const { data: memberRow } = await ctx.supabase
        .from("company_members")
        .select("id")
        .eq("company_id", ctx.company_id)
        .eq("clerk_user_id", ctx.userId)
        .single();

      if (memberRow) {
        const { count } = await ctx.supabase
          .from("employee_departments")
          .select("*", { count: "exact", head: true })
          .eq("member_id", memberRow.id)
          .eq("company_id", ctx.company_id);

        if ((count ?? 0) === 0) redirect("/pending-setup");
      }
    }

    // Independent super-admin probe. A user can be both a company
    // member AND a super admin (the dev-account case); we want the
    // full member sidebar AND the Platform section for them.
    const isSuperAdmin = await isCurrentUserSuperAdmin();

    const [{ data: company }, sopResult, memberResult] = await Promise.all([
      ctx.supabase
        .from("companies")
        .select("name, logo_url, address_line1")
        .eq("id", ctx.company_id)
        .single(),
      // For setup prompt: has the company imported at least one SOP?
      ctx.supabase
        .from("sops")
        .select("id", { count: "exact", head: true })
        .eq("company_id", ctx.company_id),
      // For setup prompt: has anyone else joined (more than just the owner)?
      ctx.supabase
        .from("company_members")
        .select("id", { count: "exact", head: true })
        .eq("company_id", ctx.company_id),
    ]);

    const companyName = company?.name ?? "Workspace";
    const sopCount = sopResult.count ?? 0;
    const memberCount = memberResult.count ?? 0;

    // Compute setup prompt for admin/manager roles — employees skip it.
    let setupPrompt: SetupPrompt | undefined;
    if (ctx.role !== "employee") {
      const isProfileComplete = Boolean(company?.logo_url && company?.address_line1);
      const hasSop = sopCount > 0;
      const hasTeammate = memberCount > 1;
      const remaining =
        (isProfileComplete ? 0 : 1) + (hasSop ? 0 : 1) + (hasTeammate ? 0 : 1);

      if (remaining > 0) {
        // The "next" task is the first incomplete one in priority order:
        // 1. Complete company profile, 2. Import first SOP, 3. Invite a teammate.
        let nextLabel: string;
        let nextHref: string;
        if (!isProfileComplete) {
          nextLabel = "Complete company profile";
          nextHref = "/dashboard/org-settings?tab=general";
        } else if (!hasSop) {
          nextLabel = "Import your first SOP";
          nextHref = "/dashboard/sops";
        } else {
          nextLabel = "Invite a teammate";
          nextHref = "/dashboard/org-settings?tab=team";
        }
        setupPrompt = { remaining, nextLabel, nextHref };
      }
    }

    return {
      kind: "viewer",
      resolved: {
        viewer: {
          kind: "member",
          role: ctx.role,
          companyName,
          isSuperAdmin: isSuperAdmin || undefined,
          setupPrompt,
        },
        impersonatingCompanyName: ctx.impersonating ? companyName : undefined,
      },
    };
  } catch (e) {
    if (e instanceof AuthError && e.code === "NO_COMPANY") {
      // Super admins carry no company_members row — they're welcome in
      // the dashboard shell. Without an active impersonation cookie
      // they get the Platform-focused view. Member-scoped pages
      // (/dashboard, /dashboard/sops, …) handle their own redirect to
      // /dashboard/platform; doing it here would loop on /dashboard/platform.
      if (await isCurrentUserSuperAdmin()) {
        return { kind: "viewer", resolved: { viewer: { kind: "superAdmin" } } };
      }
      redirect("/onboarding");
    }
    if (e instanceof AuthError && e.code === "UNAUTHENTICATED") redirect("/sign-in");
    if (e instanceof AuthError && e.code === "AUTH_BRIDGE_FAILED") {
      return { kind: "bridgeError", detail: e.detail };
    }
    if (e instanceof AuthError && e.code === "COMPANY_DEACTIVATED") {
      return { kind: "deactivated" };
    }
    throw e;
  }
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const result = await resolveViewer();
  if (result.kind === "bridgeError") return <AuthBridgeError detail={result.detail} />;
  if (result.kind === "deactivated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dc-base px-6">
        <div className="max-w-md rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-amber-500/10">
            <svg className="size-6 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-dc-text">Account suspended</h1>
          <p className="mt-2 text-sm text-dc-text-2">
            This company account has been deactivated. Please contact your administrator or{" "}
            <a href="mailto:support@opsfluency.com" className="text-(--color-brand) underline underline-offset-2">
              OpsFluency support
            </a>{" "}
            to restore access.
          </p>
        </div>
      </div>
    );
  }

  const { viewer, impersonatingCompanyName } = result.resolved;

  return (
    <AppShell viewer={viewer}>
      {impersonatingCompanyName ? (
        <ImpersonationBanner companyName={impersonatingCompanyName} />
      ) : null}
      <div id="main">{children}</div>
    </AppShell>
  );
}
