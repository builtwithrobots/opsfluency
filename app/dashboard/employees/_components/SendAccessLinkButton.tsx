"use client";

import { useState, useTransition } from "react";
import { Link2, Loader2, X } from "lucide-react";

import { Dialog, DialogBody, DialogTitle } from "@/components/ui/dialog";
import { resendAccessLink } from "../_actions/resend-access";
import { PersonalInviteQrCard } from "./PersonalInviteQrCard";

interface Props {
  clerkUserId: string;
  displayName: string | null;
}

export function SendAccessLinkButton({ clerkUserId, displayName }: Props) {
  const [open, setOpen] = useState(false);
  const [claimUrl, setClaimUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    setClaimUrl(null);
    setOpen(true);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("clerk_user_id", clerkUserId);
      const result = await resendAccessLink(fd);
      if (result.ok) {
        setClaimUrl(result.claimUrl);
      } else {
        setError("Failed to generate link. Try again.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title="Send access link"
        className="flex items-center gap-1.5 rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-2.5 py-1.5 text-xs font-medium text-dc-text-2 hover:bg-dc-overlay"
      >
        <Link2 className="size-3.5" strokeWidth={2} />
        Access link
      </button>

      <Dialog open={open} onClose={setOpen} size="md">
        <div className="flex items-center justify-between">
          <DialogTitle>Send access link</DialogTitle>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="size-4" />
          </button>
        </div>

        <DialogBody>
          {pending && (
            <div className="flex items-center gap-2 py-4 text-sm text-dc-text-2">
              <Loader2 className="size-4 animate-spin" strokeWidth={2} />
              Generating link…
            </div>
          )}

          {!pending && error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
              {error}
            </p>
          )}

          {!pending && claimUrl && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-dc-text-2">
                This link signs{" "}
                <span className="font-semibold text-dc-text">
                  {displayName ?? "the employee"}
                </span>{" "}
                in directly. It expires in <strong>1 hour</strong> and can only
                be used once. Share it via text, email, or show the QR on your
                screen.
              </p>
              <PersonalInviteQrCard claimUrl={claimUrl} employeeName={displayName} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="self-end rounded-lg bg-(--color-brand) px-4 py-2 text-sm font-semibold text-white hover:bg-(--color-brand-hover)"
              >
                Done
              </button>
            </div>
          )}
        </DialogBody>
      </Dialog>
    </>
  );
}
