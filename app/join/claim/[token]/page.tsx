import { getAdminClient } from "@/lib/supabase/admin";
import { claimPersonalInvite } from "./_actions/claim-personal-invite";
import { PersonalClaimButton } from "./_components/PersonalClaimButton";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function PersonalInvitePage({ params }: PageProps) {
  const { token } = await params;
  const admin = getAdminClient();

  const { data: invite } = await admin
    .from("employee_invites")
    .select("company_id, name, claimed_at, personal_invite_token_expires_at")
    .eq("personal_invite_token", token)
    .maybeSingle();

  const company = invite
    ? (
        await admin
          .from("companies")
          .select("name, logo_url")
          .eq("id", invite.company_id)
          .single()
      ).data
    : null;

  const companyName = company?.name ?? "your company";

  // Invalid token — generic message, no hint about existence
  if (!invite) {
    return (
      <JoinShell>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          This invite link is not valid. Ask your manager for a new one.
        </p>
      </JoinShell>
    );
  }

  // Already claimed
  if (invite.claimed_at) {
    return (
      <JoinShell companyName={companyName} company={company}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          This invite link has already been used. If you need access, ask your
          manager to send a new invite.
        </p>
      </JoinShell>
    );
  }

  // Expired
  const expiresAt = invite.personal_invite_token_expires_at
    ? new Date(invite.personal_invite_token_expires_at as string)
    : null;
  if (expiresAt && expiresAt < new Date()) {
    return (
      <JoinShell companyName={companyName} company={company}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          This invite link has expired. Ask your manager to send a new one.
        </p>
      </JoinShell>
    );
  }

  const employeeName = (invite.name as string | null) ?? null;

  return (
    <JoinShell companyName={companyName} company={company}>
      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {employeeName ?? "You've been invited!"}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {companyName} · Employee
          </p>
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Tap below to set up your account. No passwords needed — you'll be
          signed in automatically.
        </p>

        <PersonalClaimButton token={token} action={claimPersonalInvite} />
      </div>
    </JoinShell>
  );
}

function JoinShell({
  companyName,
  company,
  children,
}: {
  companyName?: string;
  company?: { name: string; logo_url: string | null } | null;
  children: import("react").ReactNode;
}) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          {company?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.logo_url}
              alt={company.name}
              className="h-12 w-auto object-contain"
            />
          ) : (
            <div className="flex size-14 items-center justify-center rounded-2xl bg-(--color-brand)/10 text-2xl font-bold text-(--color-brand)">
              {(companyName ?? "O").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-xs font-semibold tracking-[0.15em] text-(--color-brand) uppercase">
              OpsFluency
            </p>
            <h1 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {companyName ?? "Welcome"}
            </h1>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            You&apos;ve been invited
          </h2>
          {children}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-600">
          Powered by OpsFluency &mdash; frontline knowledge for every worker
        </p>
      </div>
    </main>
  );
}
