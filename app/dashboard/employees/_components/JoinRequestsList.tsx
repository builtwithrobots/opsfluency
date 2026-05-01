"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";

import { formatPhoneDisplay } from "@/lib/employees/phone";
import { approveJoinRequest, rejectJoinRequest } from "../_actions/join-requests";
import { PersonalInviteQrCard } from "./PersonalInviteQrCard";

export interface JoinRequestRow {
  id: string;
  name: string;
  phone: string;
  email_personal: string | null;
  requested_at: string;
}

interface Props {
  requests: JoinRequestRow[];
}

interface ApprovedState {
  claimUrl: string;
  employeeName: string | null;
}

function JoinRequestItem({ request }: { request: JoinRequestRow }) {
  const [dismissed, setDismissed] = useState(false);
  const [approved, setApproved] = useState<ApprovedState | null>(null);
  const [approvePending, startApprove] = useTransition();
  const [rejectPending, startReject] = useTransition();

  if (dismissed) return null;

  if (approved) {
    return (
      <li className="flex flex-col gap-4 px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-dc-text">{request.name}</p>
            <p className="text-xs text-dc-text-3">
              {formatPhoneDisplay(request.phone)}
              {request.email_personal ? ` · ${request.email_personal}` : ""}
            </p>
          </div>
          <span className="rounded-full border border-green-400/30 bg-green-400/10 px-2 py-0.5 text-xs font-semibold text-green-600 dark:text-green-400">
            Approved
          </span>
        </div>
        <PersonalInviteQrCard
          claimUrl={approved.claimUrl}
          employeeName={approved.employeeName}
        />
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="self-end text-xs font-medium text-dc-text-3 hover:text-dc-text"
        >
          Dismiss
        </button>
      </li>
    );
  }

  const requestedDate = new Date(request.requested_at).toLocaleDateString();

  return (
    <li className="flex flex-wrap items-center gap-4 px-5 py-4">
      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-dc-text">{request.name}</p>
        <p className="mt-0.5 text-xs text-dc-text-3">
          {formatPhoneDisplay(request.phone)}
          {request.email_personal ? ` · ${request.email_personal}` : ""}
          {" · Requested "}
          {requestedDate}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={approvePending || rejectPending}
          onClick={() => {
            startApprove(async () => {
              const fd = new FormData();
              fd.set("id", request.id);
              const result = await approveJoinRequest(fd);
              if (result.ok) {
                setApproved({ claimUrl: result.claimUrl, employeeName: result.employeeName });
              }
            });
          }}
          className="flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50 dark:border-green-800 dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-900"
        >
          <Check className="size-3.5" strokeWidth={2.5} />
          {approvePending ? "Approving…" : "Approve"}
        </button>

        <button
          type="button"
          disabled={approvePending || rejectPending}
          onClick={() => {
            startReject(async () => {
              const fd = new FormData();
              fd.set("id", request.id);
              const result = await rejectJoinRequest(fd);
              if (result.ok) setDismissed(true);
            });
          }}
          className="flex items-center gap-1.5 rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-1.5 text-xs font-semibold text-dc-text-2 hover:bg-dc-overlay disabled:opacity-50"
        >
          <X className="size-3.5" strokeWidth={2} />
          {rejectPending ? "Rejecting…" : "Reject"}
        </button>
      </div>
    </li>
  );
}

export function JoinRequestsList({ requests }: Props) {
  if (requests.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-dc-text">Join requests</p>
        <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
          {requests.length}
        </span>
      </div>

      <ul className="divide-y divide-[color:var(--dc-edge)] overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
        {requests.map((r) => (
          <JoinRequestItem key={r.id} request={r} />
        ))}
      </ul>
    </section>
  );
}
