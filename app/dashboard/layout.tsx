import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/dashboard/app-shell";
import { AuthBridgeError } from "@/components/dashboard/auth-bridge-error";
import type { Viewer } from "@/components/dashboard/nav-config";
import { AuthError, getCompanyContext } from "@/lib/auth/company-context";
import { isCurrentUserSuperAdmin } from "@/lib/auth/super-admin-context";

type ResolveResult =
  | { kind: "viewer"; viewer: Viewer }
  | { kind: "bridgeError"; detail?: string };

async function resolveViewer(): Promise<ResolveResult> {
  try {
    const ctx = await getCompanyContext();

    // Employees don't belong in the manager dashboard.
    if (ctx.role === "employee") redirect("/app/home");

    const { data: company } = await ctx.supabase
      .from("companies")
      .select("name")
      .eq("id", ctx.company_id)
      .single();

    return {
      kind: "viewer",
      viewer: {
        kind: "member",
        role: ctx.role,
        companyName: company?.name ?? "Workspace",
      },
    };
  } catch (e) {
    if (e instanceof AuthError && e.code === "NO_COMPANY") {
      // Super admins carry no company_members row — they're welcome in
      // the dashboard shell, just with the Platform sidebar only.
      if (await isCurrentUserSuperAdmin()) {
        return { kind: "viewer", viewer: { kind: "superAdmin" } };
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

  return (
    <AppShell viewer={result.viewer}>
      <div id="main">{children}</div>
    </AppShell>
  );
}
