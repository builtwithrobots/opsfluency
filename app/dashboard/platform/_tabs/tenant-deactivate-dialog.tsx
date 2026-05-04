"use client";

import { useState, useTransition } from "react";
import { PauseCircle } from "lucide-react";

import {
  deactivateTenant,
  type DeactivateTenantResult,
} from "@/app/dashboard/platform/_actions/deactivate-tenant";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TenantDeactivateDialogProps {
  companyId: string;
  companyName: string;
}

export function TenantDeactivateDialog({ companyId, companyName }: TenantDeactivateDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setOpen(true);
    setError(null);
  }

  function handleClose() {
    if (isPending) return;
    setOpen(false);
    setError(null);
  }

  function handleSubmit() {
    if (isPending) return;
    setError(null);

    const fd = new FormData();
    fd.append("company_id", companyId);

    startTransition(async () => {
      const result: DeactivateTenantResult = await deactivateTenant(fd);
      if (result.ok) {
        setOpen(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        title="Deactivate tenant — all data is preserved"
        className="flex items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/15 hover:border-amber-500/40 transition-colors"
      >
        <PauseCircle className="size-3" strokeWidth={2} />
        Deactivate
      </button>

      <Dialog open={open} onClose={handleClose} size="md">
        <div className="flex items-start gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
            <PauseCircle className="size-5 text-amber-400" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle>Deactivate &ldquo;{companyName}&rdquo;?</DialogTitle>
            <DialogDescription>
              All access will be suspended immediately — every member sees an
              &ldquo;account suspended&rdquo; screen until you reactivate.{" "}
              <strong className="text-dc-text">All data is preserved:</strong>{" "}
              SOPs, scan history, AI token usage, announcements, and all other
              records remain intact for reporting. You can reactivate at any time.
            </DialogDescription>
          </div>
        </div>

        <DialogBody>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
            <ul className="list-disc space-y-1 pl-4">
              <li>All members lose dashboard and PWA access immediately</li>
              <li>QR codes stop working (employees see a suspended message)</li>
              <li>All SOPs, scan logs, and AI token history are preserved</li>
              <li>Reactivation restores full access with no data loss</li>
            </ul>
          </div>

          {error ? (
            <p className="mt-3 text-sm text-red-400">{error}</p>
          ) : null}
        </DialogBody>

        <DialogActions>
          <Button plain onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            color="amber"
            disabled={isPending}
            onClick={handleSubmit}
          >
            {isPending ? "Deactivating…" : "Deactivate account"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
