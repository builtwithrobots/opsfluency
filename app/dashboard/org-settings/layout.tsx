import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AuthError, getCompanyContext } from "@/lib/auth/company-context";

export default async function OrgSettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  try {
    await getCompanyContext("admin");
  } catch (e) {
    if (e instanceof AuthError && e.code === "FORBIDDEN") redirect("/dashboard");
    if (e instanceof AuthError && e.code === "UNAUTHENTICATED") redirect("/sign-in");
    if (e instanceof AuthError && e.code === "NO_COMPANY") redirect("/onboarding");
    throw e;
  }
  return <>{children}</>;
}
