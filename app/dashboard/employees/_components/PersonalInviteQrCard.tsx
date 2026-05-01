"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, Printer } from "lucide-react";

interface Props {
  claimUrl: string;
  employeeName: string | null;
}

export function PersonalInviteQrCard({ claimUrl, employeeName }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(claimUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-dc-text-2">
        Share this personal invite link with{" "}
        <span className="font-semibold text-dc-text">
          {employeeName ?? "the employee"}
        </span>
        . They scan it and tap one button — no phone entry, no password.
        Valid for 7 days.
      </p>

      <div className="flex flex-col items-center gap-4 rounded-xl border border-[color:var(--dc-edge)] bg-white p-5 dark:bg-zinc-800 sm:flex-row sm:items-start">
        {/* QR */}
        <div className="shrink-0 rounded-lg border border-[color:var(--dc-edge)] bg-white p-2 shadow-xs dark:bg-white">
          <QRCodeSVG value={claimUrl} size={120} />
        </div>

        {/* URL + actions */}
        <div className="min-w-0 flex-1">
          <p className="truncate rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-1.5 font-mono text-xs text-dc-text-3">
            {claimUrl}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-1.5 text-xs font-medium text-dc-text-2 hover:bg-dc-overlay"
            >
              {copied ? (
                <Check className="size-3.5 text-green-500" strokeWidth={2.5} />
              ) : (
                <Copy className="size-3.5" strokeWidth={2} />
              )}
              {copied ? "Copied!" : "Copy link"}
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-1.5 text-xs font-medium text-dc-text-2 hover:bg-dc-overlay print:hidden"
            >
              <Printer className="size-3.5" strokeWidth={2} />
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
