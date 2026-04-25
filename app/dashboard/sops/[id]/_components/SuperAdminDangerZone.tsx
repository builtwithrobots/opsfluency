"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertOctagon, ChevronDown, ShieldCheck, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { hardDeleteSop } from "../../_actions";

interface Props {
  sopId: string;
  sopTitle: string;
  versionCount: number;
  hasQrCode: boolean;
}

/**
 * Super-admin only "danger zone" rendered at the bottom of every SOP
 * detail page when the viewer is in `super_admins`. Collapsed by
 * default to keep visual noise low for the common case (super admins
 * use the dashboard mostly to look at tenant data, not to nuke it).
 *
 * Uses type-to-confirm rather than `window.confirm` because the
 * blast radius is irreversible: every version, every QR scan record,
 * every uploaded original file. The delete button stays disabled
 * until the typed title matches (case-insensitive, trimmed).
 */
export function SuperAdminDangerZone({
  sopId,
  sopTitle,
  versionCount,
  hasQrCode,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const titleMatches =
    confirmTitle.trim().length > 0 &&
    confirmTitle.trim().toLowerCase() === sopTitle.trim().toLowerCase();

  function destroy() {
    if (!titleMatches) return;
    setError(null);
    startTransition(async () => {
      const r = await hardDeleteSop({ sop_id: sopId, confirm_title: confirmTitle });
      if (!r.ok) {
        setError(r.error.message ?? r.error.code);
        return;
      }
      router.replace("/dashboard/sops");
    });
  }

  return (
    <section
      aria-labelledby="sop-super-admin-danger"
      className="rounded-xl border border-(--color-signal-urgent)/40 bg-(--color-signal-urgent)/5"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
        aria-expanded={open}
        aria-controls="sop-super-admin-danger-body"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-(--color-signal-urgent)/15 text-(--color-signal-urgent)">
          <ShieldCheck className="size-4" strokeWidth={2} aria-hidden />
        </span>
        <span className="flex-1">
          <span
            id="sop-super-admin-danger"
            className="block text-sm font-semibold text-(--color-signal-urgent)"
          >
            Super admin tools
          </span>
          <span className="mt-0.5 block text-xs text-dc-text-3">
            Cross-tenant destructive actions. Visible only to super admins. Every action is
            logged in <code className="rounded bg-dc-raised px-1 py-0.5">super_admin_events</code>.
          </span>
        </span>
        <ChevronDown
          className={`size-4 text-dc-text-3 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
          aria-hidden
        />
      </button>

      {open && (
        <div
          id="sop-super-admin-danger-body"
          className="border-t border-(--color-signal-urgent)/20 px-5 py-5"
        >
          <div className="flex items-start gap-3">
            <AlertOctagon
              className="mt-0.5 size-5 shrink-0 text-(--color-signal-urgent)"
              strokeWidth={1.75}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-dc-text">Hard delete this SOP</p>
              <p className="mt-1 text-sm text-dc-text-2">
                Permanently destroys the SOP and everything that hangs off it. There is no undo.
                Use only for tenant cleanup, demo data, or correcting a manager mistake the
                tenant cannot reach themselves.
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-dc-text-2">
                <li>
                  <span className="font-medium text-dc-text">{versionCount}</span>{" "}
                  version{versionCount === 1 ? "" : "s"} (English + Spanish content)
                </li>
                <li>
                  Original uploaded files in <code className="rounded bg-dc-raised px-1 py-0.5 text-xs">sop-uploads</code>
                </li>
                <li>
                  {hasQrCode ? (
                    <>
                      <span className="font-medium text-dc-text">1</span> QR code and all of its
                      scan history
                    </>
                  ) : (
                    <>QR codes (none generated yet)</>
                  )}
                </li>
                <li>Existing printed QR labels will return HTTP 410 forever after</li>
              </ul>

              <div className="mt-5">
                <label
                  htmlFor="sop-hard-delete-confirm"
                  className="block text-xs font-medium text-dc-text-2"
                >
                  Type the SOP title to confirm:{" "}
                  <span className="font-semibold text-dc-text">{sopTitle}</span>
                </label>
                <input
                  id="sop-hard-delete-confirm"
                  type="text"
                  value={confirmTitle}
                  onChange={(e) => setConfirmTitle(e.target.value)}
                  disabled={isPending}
                  autoComplete="off"
                  spellCheck={false}
                  className="mt-1.5 w-full max-w-lg rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-signal-urgent) focus:outline-none disabled:opacity-50"
                  placeholder={sopTitle}
                  aria-describedby="sop-hard-delete-help"
                />
                <p id="sop-hard-delete-help" className="mt-1 text-xs text-dc-text-3">
                  Case-insensitive. Surrounding whitespace is ignored.
                </p>
              </div>

              {error && (
                <p
                  role="alert"
                  className="mt-4 rounded-md border border-(--color-signal-urgent)/40 bg-(--color-signal-urgent)/10 px-3 py-2 text-sm text-(--color-signal-urgent)"
                >
                  {error}
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button
                  color="red"
                  onClick={destroy}
                  disabled={!titleMatches || isPending}
                >
                  <Trash2 data-slot="icon" strokeWidth={2} />
                  {isPending ? "Deleting…" : "Permanently delete SOP"}
                </Button>
                <Button
                  plain
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setConfirmTitle("");
                    setError(null);
                  }}
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
