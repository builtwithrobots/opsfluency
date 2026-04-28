import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ShieldCheck, UserRound } from "lucide-react";

import { getAdminClient } from "@/lib/supabase/admin";
import { claimTeamInvite } from "./_actions/claim";

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  already_claimed:
    "This invite link has already been used. Ask an admin to send a new one.",
  already_member:
    "Your account is already linked to a company. Each account can belong to only one company.",
};

export default async function JoinTeamPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const { error } = await searchParams;

  const admin = getAdminClient();

  // Load invite (public — admin client bypasses RLS; no Clerk session needed)
  const { data: invite } = await admin
    .from("team_invites")
    .select("id, company_id, email, name, role, invited_at, claimed_at")
    .eq("token", token)
    .maybeSingle();

  // Load company name
  const companyName = invite
    ? (
        await admin
          .from("companies")
          .select("name")
          .eq("id", invite.company_id)
          .single()
      ).data?.name ?? "your company"
    : null;

  // If already signed in, check if they're already a member
  const { userId } = await auth();
  let alreadyMember = false;
  if (userId && invite && !invite.claimed_at) {
    const { data: existing } = await admin
      .from("company_members")
      .select("id")
      .eq("clerk_user_id", userId)
      .maybeSingle();
    alreadyMember = Boolean(existing);
  }

  const isAdmin = invite?.role === "admin";

  // Invalid token
  if (!invite) {
    return (
      <JoinShell>
        <p className="text-sm text-dc-text-2">
          This invite link is invalid or has expired. Ask an admin for a new one.
        </p>
      </JoinShell>
    );
  }

  // Already claimed or error from redirect
  if (invite.claimed_at || error === "already_claimed") {
    return (
      <JoinShell companyName={companyName ?? undefined}>
        <p className="text-sm text-dc-text-2">
          {ERROR_MESSAGES.already_claimed}
        </p>
      </JoinShell>
    );
  }

  if (error === "already_member" || alreadyMember) {
    return (
      <JoinShell companyName={companyName ?? undefined}>
        <p className="text-sm text-dc-text-2">
          {ERROR_MESSAGES.already_member}
        </p>
        <a
          href="/dashboard"
          className="mt-4 inline-block rounded-lg bg-(--color-brand) px-5 py-2.5 text-sm font-semibold text-white hover:bg-(--color-brand-hover)"
        >
          Go to dashboard
        </a>
      </JoinShell>
    );
  }

  // If no session → sign in first, come back here
  if (!userId) {
    redirect(
      `/sign-in?redirect_url=${encodeURIComponent(`/join/team/${token}`)}`,
    );
  }

  // Signed in, invite valid — show accept UI
  return (
    <JoinShell companyName={companyName ?? undefined}>
      <div className="flex flex-col gap-6">
        {/* Invite card */}
        <div className="flex items-center gap-4 rounded-xl border border-[color:var(--dc-edge)] bg-dc-raised px-5 py-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--dc-edge)] bg-dc-surface">
            {isAdmin ? (
              <ShieldCheck className="size-5 text-(--color-brand)" strokeWidth={2} />
            ) : (
              <UserRound className="size-5 text-dc-text-3" strokeWidth={2} />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-dc-text">
              {invite.name ?? invite.email}
            </p>
            <p className="mt-0.5 text-xs text-dc-text-3">
              Invited as{" "}
              <span className="font-medium capitalize text-dc-text-2">
                {invite.role}
              </span>{" "}
              · {companyName}
            </p>
          </div>
        </div>

        <p className="text-sm text-dc-text-2">
          You&apos;re signed in. Click below to accept the invitation and open
          your dashboard.
        </p>

        {/* Server Action form — no JS required */}
        <form
          action={async () => {
            "use server";
            await claimTeamInvite(token);
          }}
        >
          <button
            type="submit"
            className="w-full rounded-lg bg-(--color-brand) px-5 py-3 text-sm font-semibold text-white hover:bg-(--color-brand-hover)"
          >
            Accept invitation &amp; go to dashboard
          </button>
        </form>
      </div>
    </JoinShell>
  );
}

function JoinShell({
  companyName,
  children,
}: {
  companyName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-start justify-center bg-dc-canvas px-4 pt-24">
      <div className="w-full max-w-md rounded-2xl border border-[color:var(--dc-edge)] bg-dc-surface p-8 shadow-sm">
        <p className="text-xs font-medium tracking-[0.15em] text-(--color-brand) uppercase">
          {companyName ?? "OpsFluency"}
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-dc-text">
          You&apos;ve been invited
        </h1>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
