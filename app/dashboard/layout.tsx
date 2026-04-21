import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/dashboard/app-shell";
import { AuthBridgeError } from "@/components/dashboard/auth-bridge-error";
import { AuthError, getCompanyContext } from "@/lib/auth/company-context";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  let ctx;
  try {
    ctx = await getCompanyContext();
  } catch (e) {
    if (e instanceof AuthError && e.code === "NO_COMPANY") redirect("/onboarding");
    if (e instanceof AuthError && e.code === "UNAUTHENTICATED") redirect("/sign-in");
    if (e instanceof AuthError && e.code === "AUTH_BRIDGE_FAILED") {
      return <AuthBridgeError detail={e.detail} />;
    }
    throw e;
  }

  const { supabase, company_id, role } = ctx;

  // Role gate: employees don't belong in the manager dashboard.
  if (role === "employee") redirect("/app/home");

  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", company_id)
    .single();

  return (
    <AppShell role={role} companyName={company?.name ?? "Workspace"}>
      <div id="main">{children}</div>
    </AppShell>
  );
}
