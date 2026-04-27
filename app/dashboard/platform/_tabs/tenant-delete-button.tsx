"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import { deleteTenantAiHistory } from "../_actions/delete-tenant-ai-history";

export function TenantDeleteButton({ companyId }: { companyId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (confirming) {
    return (
      <span className="flex items-center gap-1 whitespace-nowrap text-xs">
        <button
          onClick={() =>
            startTransition(async () => {
              await deleteTenantAiHistory(companyId);
              setConfirming(false);
            })
          }
          disabled={isPending}
          className="rounded px-2 py-0.5 bg-red-500/15 text-red-400 hover:bg-red-500/25 disabled:opacity-50"
        >
          {isPending ? "Deleting…" : "Delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="rounded px-2 py-0.5 text-dc-text-3 hover:bg-dc-overlay disabled:opacity-50"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded p-1 text-dc-text-3 hover:text-red-400 hover:bg-dc-overlay transition-colors"
      title="Delete all AI call history for this tenant"
    >
      <Trash2 className="size-3.5" strokeWidth={2} />
    </button>
  );
}
