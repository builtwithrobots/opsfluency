"use client";

import { useState } from "react";
import { Check, Copy, Mail, ShieldCheck, Trash2, UserRound } from "lucide-react";

import { deleteTeamInvite } from "../_actions/team-invite";

interface Dept {
  id: string;
  name: string;
}

interface PendingInvite {
  id: string;
  token: string;
  email: string;
  name: string | null;
  role: string;
  invited_at: string;
  department_ids: string[];
}

interface Props {
  invites: PendingInvite[];
  departments: Dept[];
  appUrl: string;
}

function InviteRow({
  invite,
  departments,
  appUrl,
}: {
  invite: PendingInvite;
  departments: Dept[];
  appUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const link = `${appUrl}/join/team/${invite.token}`;

  const deptMap = new Map(departments.map((d) => [d.id, d.name]));
  const assignedDepts = invite.department_ids
    .map((id) => deptMap.get(id))
    .filter(Boolean) as string[];

  function copyLink() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const isAdmin = invite.role === "admin";

  return (
    <li className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--dc-edge)] bg-dc-raised">
          {isAdmin ? (
            <ShieldCheck className="size-4 text-(--color-brand)" strokeWidth={2} />
          ) : (
            <UserRound className="size-4 text-dc-text-3" strokeWidth={2} />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium text-dc-text">
              {invite.name ?? invite.email}
            </p>
            <span className="rounded border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-600 dark:text-amber-400 uppercase">
              Pending
            </span>
            <span
              className={
                isAdmin
                  ? "rounded border border-(--color-brand)/30 bg-(--color-brand)/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-(--color-brand) uppercase"
                  : "rounded border border-[color:var(--dc-edge)] bg-dc-raised px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-dc-text-3 uppercase"
              }
            >
              {isAdmin ? "Admin" : "Manager"}
            </span>
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-dc-text-3">
            <span className="flex items-center gap-1">
              <Mail className="size-3 shrink-0" />
              {invite.email}
            </span>
            <span>·</span>
            <span>Invited {new Date(invite.invited_at).toLocaleDateString()}</span>
            {assignedDepts.length > 0 && (
              <>
                <span>·</span>
                <span>{assignedDepts.join(", ")}</span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={copyLink}
          title="Copy invite link"
          className="flex items-center gap-1.5 rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-1.5 text-xs font-medium text-dc-text-2 hover:bg-dc-overlay"
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-500" />
          ) : (
            <Copy className="size-3.5" />
          )}
          {copied ? "Copied!" : "Copy link"}
        </button>

        <form action={deleteTeamInvite}>
          <input type="hidden" name="invite_id" value={invite.id} />
          <button
            type="submit"
            title="Revoke invite"
            className="flex size-8 items-center justify-center rounded-md border border-[color:var(--dc-edge)] bg-dc-raised text-dc-text-3 hover:border-(--color-signal-urgent)/30 hover:bg-(--color-signal-urgent)/10 hover:text-(--color-signal-urgent)"
          >
            <Trash2 className="size-3.5" />
          </button>
        </form>
      </div>
    </li>
  );
}

export function PendingTeamInvitesList({ invites, departments, appUrl }: Props) {
  if (!invites.length) return null;

  return (
    <ul className="divide-y divide-[color:var(--dc-edge)] overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
      {invites.map((inv) => (
        <InviteRow key={inv.id} invite={inv} departments={departments} appUrl={appUrl} />
      ))}
    </ul>
  );
}
