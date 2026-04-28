"use client";

import { useActionState } from "react";
import type { ClaimTeamState } from "../_actions/claim";

interface Props {
  token: string;
  action: (prev: ClaimTeamState, formData: FormData) => Promise<ClaimTeamState>;
}

export function ClaimTeamForm({ token, action }: Props) {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      {state?.error && (
        <p className="rounded-lg border border-(--color-signal-urgent)/30 bg-(--color-signal-urgent)/10 px-3 py-2 text-sm text-(--color-signal-urgent)">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-(--color-brand) px-5 py-3 text-sm font-semibold text-white hover:bg-(--color-brand-hover) disabled:opacity-50"
      >
        {isPending ? "Setting up your account…" : "Accept invitation"}
      </button>
    </form>
  );
}
