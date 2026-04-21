import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AuthError } from "@/lib/auth/company-context";
import { getSuperAdminContext } from "@/lib/auth/super-admin-context";

export default async function SuperAdminLayout({ children }: { children: ReactNode }) {
  try {
    await getSuperAdminContext();
  } catch (e) {
    if (e instanceof AuthError && e.code === "UNAUTHENTICATED") redirect("/sign-in");
    if (e instanceof AuthError && e.code === "FORBIDDEN") redirect("/");
    throw e;
  }

  return (
    <div className="min-h-screen bg-dc-bg">
      <header className="flex items-center justify-between border-b border-[color:var(--dc-edge)] bg-dc-surface px-6 py-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-8 items-center justify-center rounded-lg bg-(--color-brand) shadow-[0_0_12px_rgba(20,184,166,0.35)]"
          >
            <span className="font-display text-[11px] font-bold text-white">OF</span>
          </span>
          <span className="font-display text-lg tracking-[0.05em] uppercase text-dc-text">
            OpsFluency
          </span>
          <span className="ml-2 rounded-full border border-(--color-brand)/40 bg-(--color-brand)/10 px-2.5 py-0.5 font-mono text-[10px] tracking-[0.15em] uppercase text-(--color-brand)">
            Super admin
          </span>
        </div>
        <UserButton />
      </header>
      <div id="main">{children}</div>
    </div>
  );
}
