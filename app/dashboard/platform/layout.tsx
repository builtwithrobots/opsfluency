import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AuthError } from "@/lib/auth/company-context";
import { getSuperAdminContext } from "@/lib/auth/super-admin-context";

/**
 * Every `/dashboard/platform/*` route is super-admin only. The parent
 * `/dashboard` layout already renders the AppShell with the Platform
 * sidebar; this layer is a pure authorization gate so individual pages
 * don't each have to remember to call `getSuperAdminContext()`.
 */
export default async function PlatformLayout({ children }: { children: ReactNode }) {
  try {
    await getSuperAdminContext();
  } catch (e) {
    if (e instanceof AuthError && e.code === "FORBIDDEN") redirect("/dashboard");
    if (e instanceof AuthError && e.code === "UNAUTHENTICATED") redirect("/sign-in");
    throw e;
  }
  return <>{children}</>;
}
