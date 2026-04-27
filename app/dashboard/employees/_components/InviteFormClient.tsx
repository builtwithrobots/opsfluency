"use client";

import { useActionState, useState } from "react";
import { UserRoundPlus, X } from "lucide-react";

import {
  Dialog,
  DialogBody,
  DialogTitle,
  DialogActions,
} from "@/components/ui/dialog";
import { createInvite, type InviteResult } from "../_actions/employees";

interface Dept {
  id: string;
  name: string;
}

interface Props {
  departments: Dept[];
}

const initial: InviteResult | null = null;

export function InviteFormClient({ departments }: Props) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState(
    async (_prev: InviteResult | null, formData: FormData) => {
      const result = await createInvite(formData);
      if (result.ok) setOpen(false);
      return result;
    },
    initial,
  );

  const errorMsg =
    !state || state.ok
      ? null
      : state.error.code === "INVALID_PHONE"
        ? "Enter a valid US phone number (e.g. 555-123-4567)."
        : state.error.code === "DUPLICATE_PHONE"
          ? "An invite for that number already exists."
          : (state.error.message ?? "Something went wrong. Try again.");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-(--color-brand)/30 bg-(--color-brand)/10 px-4 py-2 text-sm font-semibold text-(--color-brand) hover:bg-(--color-brand)/20"
      >
        <UserRoundPlus className="size-4" strokeWidth={2} />
        Invite employee
      </button>

      <Dialog open={open} onClose={setOpen} size="md">
        <div className="flex items-center justify-between">
          <DialogTitle>Invite employee</DialogTitle>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="size-4" />
          </button>
        </div>

        <DialogBody>
          <form id="invite-form" action={action} className="flex flex-col gap-5">
            {/* Phone — required */}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold tracking-[0.1em] text-dc-text-3 uppercase">
                Phone number{" "}
                <span className="text-(--color-signal-urgent)">*</span>
              </span>
              <input
                name="phone"
                type="tel"
                required
                placeholder="(555) 123-4567"
                className="w-full rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
              />
              <p className="text-xs text-dc-text-3">
                The employee scans the QR code and enters this number to claim
                their account — no app download required.
              </p>
            </label>

            {/* Name — optional */}
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

            {/* Email row — work + personal side by side on larger screens */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Work email */}
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold tracking-[0.1em] text-dc-text-3 uppercase">
                  Work email{" "}
                  <span className="font-normal text-dc-text-3">(optional)</span>
                </span>
                <input
                  name="email_work"
                  type="email"
                  placeholder="jane@company.com"
                  className="w-full rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
                />
                <p className="text-xs text-dc-text-3">Company-issued address.</p>
              </label>

              {/* Personal email */}
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold tracking-[0.1em] text-dc-text-3 uppercase">
                  Personal email{" "}
                  <span className="font-normal text-(--color-brand)">(recommended)</span>
                </span>
                <input
                  name="email_personal"
                  type="email"
                  placeholder="jane@gmail.com"
                  className="w-full rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
                />
                <p className="text-xs text-dc-text-3">
                  Used for magic-link re-login if session expires.
                </p>
              </label>
            </div>

            {/* Departments — optional */}
            {departments.length > 0 && (
              <fieldset className="flex flex-col gap-2">
                <legend className="text-xs font-semibold tracking-[0.1em] text-dc-text-3 uppercase">
                  Departments{" "}
                  <span className="font-normal text-dc-text-3">(optional)</span>
                </legend>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-2">
                  {departments.map((d) => (
                    <label
                      key={d.id}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        name="department_ids"
                        value={d.id}
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
            form="invite-form"
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-(--color-brand) px-4 py-2 text-sm font-semibold text-white hover:bg-(--color-brand-hover) disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Create invite"}
          </button>
        </DialogActions>
      </Dialog>
    </>
  );
}
