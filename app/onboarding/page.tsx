import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { AuthError, getCompanyContext } from "@/lib/auth/company-context";
import { isCurrentUserSuperAdmin } from "@/lib/auth/super-admin-context";

import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  // Super admins don't belong in any company — bootstrapping one for
  // them would create a shell tenant. Send them to the Platform surface
  // inside the dashboard shell.
  if (await isCurrentUserSuperAdmin()) redirect("/dashboard/platform");

  try {
    await getCompanyContext();
    redirect("/dashboard");
  } catch (e) {
    if (!(e instanceof AuthError) || e.code !== "NO_COMPANY") throw e;
  }

  return (
    <div className="flex min-h-screen flex-col bg-dc-bg">
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
        </div>
        <UserButton />
      </header>

      <main id="main" className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="flex w-full max-w-md flex-col gap-8">
          <div className="flex flex-col gap-3 text-center">
            <p className="text-xs font-medium tracking-[0.15em] text-(--color-brand) uppercase">
              Step 1 of 1
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-dc-text md:text-4xl">
              Create your company
            </h1>
            <p className="text-dc-text-2">
              This sets up your admin account, seeds the four default departments
              (Safety, Equipment, Process, HR), and opens the manager dashboard.
            </p>
          </div>
          <div className="rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-6 shadow-xs">
            <OnboardingForm />
          </div>
        </div>
      </main>
    </div>
  );
}
