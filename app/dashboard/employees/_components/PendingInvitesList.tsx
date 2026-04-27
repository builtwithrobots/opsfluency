import { Trash2 } from "lucide-react";

import { deleteInvite } from "../_actions/employees";
import { formatPhoneDisplay } from "@/lib/employees/phone";

export interface InviteRow {
  id: string;
  phone: string;
  name: string | null;
  email_work: string | null;
  email_personal: string | null;
  department_ids: string[];
  invited_at: string;
}

interface Props {
  invites: InviteRow[];
  deptMap: Record<string, string>;
}

export function PendingInvitesList({ invites, deptMap }: Props) {
  if (!invites.length) {
    return (
      <div className="rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-6 py-8 text-center">
        <p className="text-sm text-dc-text-2">No pending invites.</p>
        <p className="mt-1 text-xs text-dc-text-3">
          Click &ldquo;Invite employee&rdquo; to add someone — they&apos;ll
          claim their account by scanning the QR above.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[color:var(--dc-edge)] overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
      {invites.map((invite) => {
        const depts = invite.department_ids
          .map((id) => deptMap[id])
          .filter(Boolean);
        const invitedDate = new Date(invite.invited_at).toLocaleDateString();
        const initials = invite.name
          ? invite.name.slice(0, 2).toUpperCase()
          : "??";

        // The email Clerk will actually use for magic-link logins
        const loginEmail = invite.email_personal ?? invite.email_work;

        return (
          <li
            key={invite.id}
            className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
          >
            <div className="flex min-w-0 items-center gap-3">
              {/* Avatar */}
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--dc-edge)] bg-dc-raised text-xs font-semibold text-dc-text-3">
                {initials}
              </div>

              {/* Info */}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-dc-text">
                    {invite.name ?? formatPhoneDisplay(invite.phone)}
                  </p>
                  <span className="rounded border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-600 uppercase dark:text-amber-400">
                    Pending
                  </span>
                </div>

                <p className="mt-0.5 text-xs text-dc-text-3">
                  {formatPhoneDisplay(invite.phone)}
                  {loginEmail ? ` · ${loginEmail}` : ""}
                  {invite.email_work && invite.email_personal ? (
                    <span className="ml-1 text-dc-text-3">
                      (work: {invite.email_work})
                    </span>
                  ) : null}
                  {" · "}Invited {invitedDate}
                </p>

                {!loginEmail && (
                  <p className="mt-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                    No email — employee can only log in via the claim QR.
                    Consider adding a personal email.
                  </p>
                )}

                {depts.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {depts.map((name) => (
                      <span
                        key={name}
                        className="rounded border border-[color:var(--dc-edge)] bg-dc-raised px-1.5 py-0.5 text-[10px] text-dc-text-3"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Delete */}
            <form action={deleteInvite}>
              <input type="hidden" name="id" value={invite.id} />
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-md border border-(--color-signal-urgent)/30 bg-(--color-signal-urgent)/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-(--color-signal-urgent) uppercase hover:bg-(--color-signal-urgent)/20"
              >
                <Trash2 className="size-3" strokeWidth={2} />
                Delete
              </button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}
