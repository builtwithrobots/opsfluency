"use client";

import { useActionState, useState } from "react";
import { Pencil, X } from "lucide-react";

import {
  Dialog,
  DialogBody,
  DialogTitle,
  DialogActions,
} from "@/components/ui/dialog";
import { updateInvite, type UpdateInviteResult } from "../_actions/edit-employee";
import { type InviteRow } from "./PendingInvitesList";

interface Dept {
  id: string;
  name: string;
}

interface Props {
  invite: InviteRow;
  departments: Dept[];
}

export function EditInviteButton({ invite, departments }: Props) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState(
    async (_prev: UpdateInviteResult | null, formData: FormData) => {
      const result = await updateInvite(_prev, formData);
      if (result.ok) setOpen(false);
      return result;
    },
    null,
  );

  const errorMsg =
    state && !state.ok
      ? state.error.code === "INVALID_PHONE"
        ? "Enter a valid US phone number (e.g. 555-123-4567)."
        : state.error.code === "DUPLICATE_PHONE"
          ? "An invite for that number already exists."
          : (state.error.message ?? "Something went wrong. Try again.")
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-1.5 text-xs font-semibold tracking-wide text-dc-text-2 uppercase hover:bg-dc-overlay"
        aria-label={`Edit invite for ${invite.name ?? invite.phone}`}
      >
        <Pencil className="size-3" strokeWidth={2} />
        Edit
      </button>

      <Dialog open={open} onClose={setOpen} size="md">
        <div className="flex items-center justify-between">
          <DialogTitle>Edit invite</DialogTitle>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="size-4" />
          </button>
        </div>

        <DialogBody>
          <form id="edit-invite-form" action={action} className="flex flex-col gap-5">
            <input type="hidden" name="invite_id" value={invite.id} />

            {/* Phone */}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold tracking-[0.1em] text-dc-text-3 uppercase">
                Phone number <span className="text-(--color-signal-urgent)">*</span>
              </span>
              <input
                name="phone"
                type="tel"
                required
                defaultValue={invite.phone}
                placeholder="(555) 123-4567"
                className="w-full rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
              />
            </label>

            {/* Name */}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold tracking-[0.1em] text-dc-text-3 uppercase">
                Name <span className="font-normal text-dc-text-3">(optional)</span>
              </span>
              <input
                name="name"
                type="text"
                defaultValue={invite.name ?? ""}
                placeholder="Jane Smith"
                className="w-full rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
              />
            </label>

            {/* Emails */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold tracking-[0.1em] text-dc-text-3 uppercase">
                  Work email <span className="font-normal text-dc-text-3">(optional)</span>
                </span>
                <input
                  name="email_work"
                  type="email"
                  defaultValue={invite.email_work ?? ""}
                  placeholder="jane@company.com"
                  className="w-full rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold tracking-[0.1em] text-dc-text-3 uppercase">
                  Personal email <span className="font-normal text-(--color-brand)">(recommended)</span>
                </span>
                <input
                  name="email_personal"
                  type="email"
                  defaultValue={invite.email_personal ?? ""}
                  placeholder="jane@gmail.com"
                  className="w-full rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
                />
              </label>
            </div>

            {/* Departments */}
            {departments.length > 0 && (
              <fieldset className="flex flex-col gap-2">
                <legend className="text-xs font-semibold tracking-[0.1em] text-dc-text-3 uppercase">
                  Departments <span className="font-normal text-dc-text-3">(optional)</span>
                </legend>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-2">
                  {departments.map((d) => (
                    <label key={d.id} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        name="department_ids"
                        value={d.id}
                        defaultChecked={invite.department_ids.includes(d.id)}
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
            form="edit-invite-form"
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
