import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/dashboard/app-shell";
import { AuthBridgeError } from "@/components/dashboard/auth-bridge-error";
import { ImpersonationBanner } from "@/components/dashboard/impersonation-banner";
import type { Viewer } from "@/components/dashboard/nav-config";
import { AuthError, getCompanyContext } from "@/lib/auth/company-context";
import { isCurrentUserSuperAdmin } from "@/lib/auth/super-admin-context";

interface Resolved {
  viewer: Viewer;
  impersonatingCompanyName?: string;
}

type ResolveResult =
  | { kind: "viewer"; resolved: Resolved }
  | { kind: "bridgeError"; detail?: string };

async function resolveViewer(): Promise<ResolveResult> {
  try {
    const ctx = await getCompanyContext();

    // Employees don't belong in the manager dashboard. Skip this
    // redirect when impersonating so super admins can never get bounced
    // out mid-session — impersonation always forces role='admin' anyway.
    if (ctx.role === "employee" && !ctx.impersonating) redirect("/app/home");

    const { data: company } = await ctx.supabase
      .from("companies")
      .select("name")
      .eq("id", ctx.company_id)
      .single();

    const companyName = company?.name ?? "Workspace";

    return {
      kind: "viewer",
      resolved: {
        viewer: { kind: "member", role: ctx.role, companyName },
        impersonatingCompanyName: ctx.impersonating ? companyName : undefined,
      },
    };
  } catch (e) {
    if (e instanceof AuthError && e.code === "NO_COMPANY") {
      // Super admins carry no company_members row — they're welcome in
      // the dashboard shell. Without an active impersonation cookie
      // they get the Platform-focused view.
      if (await isCurrentUserSuperAdmin()) {
        return { kind: "viewer", resolved: { viewer: { kind: "superAdmin" } } };
      }
      redirect("/onboarding");
    }
    if (e instanceof AuthError && e.code === "UNAUTHENTICATED") redirect("/sign-in");
    if (e instanceof AuthError && e.code === "AUTH_BRIDGE_FAILED") {
      return { kind: "bridgeError", detail: e.detail };
    }
    throw e;
  }
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const result = await resolveViewer();
  if (result.kind === "bridgeError") return <AuthBridgeError detail={result.detail} />;

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
