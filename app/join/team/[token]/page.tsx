import { ShieldCheck, UserRound } from "lucide-react";

import { getAdminClient } from "@/lib/supabase/admin";
import { claimTeamInvite } from "./_actions/claim";
import { ClaimTeamForm } from "./_components/ClaimTeamForm";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function JoinTeamPage({ params }: PageProps) {
  const { token } = await params;
  const admin = getAdminClient();

  const { data: invite } = await admin
    .from("team_invites")
    .select("company_id, email, name, role, invited_at, claimed_at")
    .eq("token", token)
    .maybeSingle();

  const companyName = invite
    ? (
        await admin
          .from("companies")
          .select("name")
          .eq("id", invite.company_id)
          .single()
      ).data?.name ?? "your company"
    : null;

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

  // Already claimed
  if (invite.claimed_at) {
    return (
      <JoinShell companyName={companyName ?? undefined}>
        <p className="text-sm text-dc-text-2">
          This invite link has already been used. Ask an admin to send you a
          new one.
        </p>
      </JoinShell>
    );
  }

  const isAdmin = invite.role === "admin";

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
              </span>
              {" · "}
              {companyName}
            </p>
          </div>
        </div>

        <p className="text-sm text-dc-text-2">
          Click below to accept. We&apos;ll set up your account for{" "}
          <span className="font-medium text-dc-text">{invite.email}</span> and
          sign you in automatically — no separate sign-up needed.
        </p>

        <ClaimTeamForm token={token} action={claimTeamInvite} />
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
