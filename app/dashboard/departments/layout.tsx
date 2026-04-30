import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AuthError } from "@/lib/auth/company-context";
import { getCompanyContextOrPlatform } from "@/lib/auth/redirect-helpers";

export default async function DepartmentsLayout({
  children,
}: {
  children: ReactNode;
}) {
  try {
    await getCompanyContextOrPlatform("manager");
  } catch (e) {
    if (e instanceof AuthError && e.code === "FORBIDDEN") redirect("/dashboard");
    if (e instanceof AuthError && e.code === "UNAUTHENTICATED") redirect("/sign-in");
    if (e instanceof AuthError && e.code === "NO_COMPANY") redirect("/onboarding");
    throw e;
  }
  return <>{children}</>;
}
