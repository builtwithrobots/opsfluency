import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

import { getRequestClient } from "@/lib/supabase/server";

type Cta =
  | { kind: "signedOut" }
  | { kind: "needsOnboarding" }
  | { kind: "signedIn" }
  | { kind: "superAdmin" };

async function resolveCta(): Promise<Cta> {
  const { userId } = await auth();
  if (!userId) return { kind: "signedOut" };

  const supabase = await getRequestClient();

  // Super admins aren't members of any company, so they'd otherwise fall
  // through to the "finish setup" CTA. Check the allowlist first.
  const { data: isSuper } = await supabase.rpc("is_super_admin");
  if (isSuper) return { kind: "superAdmin" };

  const { data: member } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  return member ? { kind: "signedIn" } : { kind: "needsOnboarding" };
}

export default async function Home() {
  const cta = await resolveCta();

  return (
    <main
      id="main"
      className="flex-1 flex flex-col items-center justify-center px-6 py-24 gap-8 text-center background"
    >
      <div className="max-w-2xl flex flex-col items-center gap-6">
        <span
          className="inline-block px-3 py-1 text-xs font-mono uppercase tracking-widest rounded-full border border-dc-edge text-dc-text-2"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Pre-launch
        </span>
        <h1
          className="text-5xl md:text-6xl font-bold tracking-tight text-dc-text"
          style={{ fontFamily: "var(--font-display)" }}
        >
          OpsFluency
        </h1>
        <p className="text-lg md:text-xl text-dc-text-2 leading-relaxed">
          Frontline knowledge and engagement for multilingual warehouse and
          manufacturing teams. Bilingual SOPs, QR-triggered learning,
          departmental communication — one system.
        </p>
        <div className="flex items-center gap-3 pt-4">
          {cta.kind === "superAdmin" ? (
            <Link
              href="/super-admin"
              className="px-6 py-3 rounded-md bg-[var(--color-brand)] text-white font-semibold hover:bg-[var(--color-brand-hover)] transition-colors"
            >
              Open super admin
            </Link>
          ) : cta.kind === "signedIn" ? (
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-md bg-[var(--color-brand)] text-white font-semibold hover:bg-[var(--color-brand-hover)] transition-colors"
            >
              Open dashboard
            </Link>
          ) : cta.kind === "needsOnboarding" ? (
            <Link
              href="/onboarding"
              className="px-6 py-3 rounded-md bg-[var(--color-brand)] text-white font-semibold hover:bg-[var(--color-brand-hover)] transition-colors"
            >
              Finish setup
            </Link>
          ) : (
            <>
              <Link
                href="/sign-up"
                className="px-6 py-3 rounded-md bg-[var(--color-brand)] text-white font-semibold hover:bg-[var(--color-brand-hover)] transition-colors"
              >
                Sign up
              </Link>
              <Link
                href="/sign-in"
                className="px-6 py-3 rounded-md border border-dc-edge text-dc-text hover:bg-dc-raised transition-colors"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
