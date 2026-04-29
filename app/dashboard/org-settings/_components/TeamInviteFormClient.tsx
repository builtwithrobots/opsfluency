"use client";

import { useActionState, useState } from "react";
import { Check, Copy, UserRoundPlus, X } from "lucide-react";
import { useEffect } from "react";

import {
  Dialog,
  DialogBody,
  DialogTitle,
  DialogActions,
} from "@/components/ui/dialog";
import {
  createTeamInvite,
  type TeamInviteResult,
} from "../_actions/team-invite";

interface Dept {
  id: string;
  name: string;
}

interface Props {
  departments: Dept[];
}

const INITIAL: TeamInviteResult | null = null;
const APP_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL ?? "";

export function TeamInviteFormClient({ departments }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [role, setRole] = useState<"manager" | "admin">("manager");
  const [selectedDepts, setSelectedDepts] = useState<Set<string>>(new Set());

  const [state, action, isPending] = useActionState(
    async (_prev: TeamInviteResult | null, formData: FormData) => {
      return await createTeamInvite(formData);
    },
    INITIAL,
  );

  // Clear dept selection when switching to admin (admins don't need depts)
  useEffect(() => {
    if (role === "admin") setSelectedDepts(new Set());
  }, [role]);

  const deptRequired = role === "manager";
  const submitDisabled = isPending || (deptRequired && selectedDepts.size === 0);

  const inviteUrl = state?.ok ? `${APP_URL}/join/team/${state.token}` : null;

  const errorMsg =
    !state || state.ok
      ? null
      : state.error.code === "DUPLICATE_EMAIL"
        ? "An unclaimed invite already exists for that email."
        : state.error.code === "INVALID_INPUT"
          ? (state.error.message ?? "Check the form and try again.")
          : (state.error.message ?? "Something went wrong. Try again.");

  function handleClose() {
    setOpen(false);
    setCopied(false);
  }

  function copyLink() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-(--color-brand)/30 bg-(--color-brand)/10 px-4 py-2 text-sm font-semibold text-(--color-brand) hover:bg-(--color-brand)/20"
      >
        <UserRoundPlus className="size-4" strokeWidth={2} />
        Invite admin or manager
      </button>

      <Dialog open={open} onClose={handleClose} size="md">
        <div className="flex items-center justify-between">
          <DialogTitle>
            {inviteUrl ? "Invite created" : "Invite admin or manager"}
          </DialogTitle>
          <button
            type="button"
            onClick={handleClose}
            className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="size-4" />
          </button>
        </div>

        <DialogBody>
          {inviteUrl ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-dc-text-2">
                Share this link with the invitee. It expires once claimed.
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2">
                <code className="min-w-0 flex-1 truncate font-mono text-xs text-dc-text">
                  {inviteUrl}
                </code>
                <button
                  type="button"
                  onClick={copyLink}
                  className="shrink-0 rounded p-1 text-dc-text-3 hover:text-dc-text"
                  title="Copy link"
                >
                  {copied ? (
                    <Check className="size-4 text-emerald-500" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-dc-text-3">
                The link also appears in the Pending invites list, where you
                can copy it again at any time.
              </p>
            </div>
          ) : (
            <form
              id="team-invite-form"
              action={action}
              className="flex flex-col gap-5"
            >
              {/* Email */}
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold tracking-[0.1em] text-dc-text-3 uppercase">
                  Work email{" "}
                  <span className="text-(--color-signal-urgent)">*</span>
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="jane@yourcompany.com"
                  className="w-full rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
                />
              </label>

              {/* Name */}
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold tracking-[0.1em] text-dc-text-3 uppercase">
                  Name{" "}
                  <span className="font-normal text-dc-text-3">(optional)</span>
                </span>
                <input
                  name="name"
                  type="text"
                  placeholder="Jane Smith"
                  className="w-full rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
                />
              </label>

              {/* Role */}
              <fieldset className="flex flex-col gap-2">
                <legend className="text-xs font-semibold tracking-[0.1em] text-dc-text-3 uppercase">
                  Role{" "}
                  <span className="text-(--color-signal-urgent)">*</span>
                </legend>
                <div className="flex gap-3">
                  {(["manager", "admin"] as const).map((r) => (
                    <label
                      key={r}
                      className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2.5 has-[:checked]:border-(--color-brand)/50 has-[:checked]:bg-(--color-brand)/5"
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r}
                        checked={role === r}
                        onChange={() => setRole(r)}
                        className="accent-(--color-brand)"
                      />
                      <span className="text-sm font-medium text-dc-text capitalize">
                        {r}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-dc-text-3">
                  Admins have full org access. Managers are scoped to their
                  departments.
                </p>
              </fieldset>

              {/* Departments */}
              {departments.length > 0 && (
                <fieldset className="flex flex-col gap-2">
                  <legend className="text-xs font-semibold tracking-[0.1em] text-dc-text-3 uppercase">
                    Departments{" "}
                    {deptRequired ? (
                      <span className="text-(--color-signal-urgent)">*</span>
                    ) : (
                      <span className="font-normal text-dc-text-3">(optional)</span>
                    )}
                  </legend>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {departments.map((d) => (
                      <label
                        key={d.id}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          name="department_ids"
                          value={d.id}
                          checked={selectedDepts.has(d.id)}
                          onChange={() =>
                            setSelectedDepts((prev) => {
                              const next = new Set(prev);
                              next.has(d.id) ? next.delete(d.id) : next.add(d.id);
                              return next;
                            })
                          }
                          className="rounded border-[color:var(--dc-edge)] accent-(--color-brand)"
                        />
                        <span className="text-sm text-dc-text">{d.name}</span>
                      </label>
                    ))}
                  </div>
                  {deptRequired && selectedDepts.size === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Managers must be assigned to at least one department.
                    </p>
                  )}
                </fieldset>
              )}

              {errorMsg && (
                <p className="rounded-lg border border-(--color-signal-urgent)/30 bg-(--color-signal-urgent)/10 px-3 py-2 text-sm text-(--color-signal-urgent)">
                  {errorMsg}
                </p>
              )}
            </form>
          )}
        </DialogBody>

        <DialogActions>
          {inviteUrl ? (
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg bg-(--color-brand) px-4 py-2 text-sm font-semibold text-white hover:bg-(--color-brand-hover)"
            >
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-[color:var(--dc-edge)] px-4 py-2 text-sm text-dc-text-2 hover:bg-dc-overlay"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="team-invite-form"
                disabled={submitDisabled}
                className="flex items-center gap-2 rounded-lg bg-(--color-brand) px-4 py-2 text-sm font-semibold text-white hover:bg-(--color-brand-hover) disabled:opacity-50"
              >
                {isPending ? "Creating…" : "Create invite"}
              </button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
