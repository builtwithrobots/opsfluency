"use client";

import { useActionState, useState } from "react";
import { Pencil, X } from "lucide-react";

import {
  Dialog,
  DialogBody,
  DialogTitle,
  DialogActions,
} from "@/components/ui/dialog";
import { updateEmployee, type UpdateEmployeeResult } from "../_actions/edit-employee";

interface Dept {
  id: string;
  name: string;
}

interface Props {
  memberId: string;
  clerkUserId: string;
  displayName: string | null;
  currentRole: string;
  departments: Dept[];
  memberDeptIds: string[];
}

export function EditEmployeeButton({
  memberId,
  clerkUserId,
  displayName,
  currentRole,
  departments,
  memberDeptIds,
}: Props) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState(
    async (_prev: UpdateEmployeeResult | null, formData: FormData) => {
      const result = await updateEmployee(_prev, formData);
      if (result.ok) setOpen(false);
      return result;
    },
    null,
  );

  // Split displayName back into first/last for the form defaults
  const nameParts = (displayName ?? "").split(" ").filter(Boolean);
  const defaultFirst = nameParts[0] ?? "";
  const defaultLast = nameParts.slice(1).join(" ");

  const errorMsg =
    state && !state.ok
      ? (state.error.message ?? "Something went wrong. Try again.")
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-1.5 text-xs font-semibold tracking-wide text-dc-text-2 uppercase hover:bg-dc-overlay"
        aria-label={`Edit ${displayName ?? clerkUserId}`}
      >
        <Pencil className="size-3" strokeWidth={2} />
        Edit
      </button>

      <Dialog open={open} onClose={setOpen} size="md">
        <div className="flex items-center justify-between">
          <DialogTitle>Edit employee</DialogTitle>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="size-4" />
          </button>
        </div>

        <DialogBody>
          <form id="edit-employee-form" action={action} className="flex flex-col gap-5">
            <input type="hidden" name="member_id" value={memberId} />
            <input type="hidden" name="clerk_user_id" value={clerkUserId} />

            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold tracking-[0.1em] text-dc-text-3 uppercase">
                  First name
                </span>
                <input
                  name="first_name"
                  type="text"
                  defaultValue={defaultFirst}
                  placeholder="Jane"
                  className="w-full rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold tracking-[0.1em] text-dc-text-3 uppercase">
                  Last name
                </span>
                <input
                  name="last_name"
                  type="text"
                  defaultValue={defaultLast}
                  placeholder="Smith"
                  className="w-full rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
                />
              </label>
            </div>

            {/* Access level */}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold tracking-[0.1em] text-dc-text-3 uppercase">
                Access level
              </span>
              <select
                name="role"
                defaultValue={currentRole}
                className="w-full rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text focus:border-(--color-brand) focus:outline-none"
              >
                <option value="employee">Employee — view SOPs, announcements, HR chat</option>
                <option value="manager">Manager — create SOPs, invite employees, post announcements</option>
              </select>
            </label>

            {/* Departments */}
            {departments.length > 0 && (
              <fieldset className="flex flex-col gap-2">
                <legend className="text-xs font-semibold tracking-[0.1em] text-dc-text-3 uppercase">
                  Departments
                </legend>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-2">
                  {departments.map((d) => (
                    <label key={d.id} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        name="department_ids"
                        value={d.id}
                        defaultChecked={memberDeptIds.includes(d.id)}
                        className="rounded border-[color:var(--dc-edge)] accent-(--color-brand)"
                      />
                      <span className="text-sm text-dc-text">{d.name}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {errorMsg && (
              <p className="rounded-lg border border-(--color-signal-urgent)/30 bg-(--color-signal-urgent)/10 px-3 py-2 text-sm text-(--color-signal-urgent)">
                {errorMsg}
              </p>
            )}
          </form>
        </DialogBody>

        <DialogActions>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-[color:var(--dc-edge)] px-4 py-2 text-sm text-dc-text-2 hover:bg-dc-overlay"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-employee-form"
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-(--color-brand) px-4 py-2 text-sm font-semibold text-white hover:bg-(--color-brand-hover) disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </DialogActions>
      </Dialog>
    </>
  );
}
