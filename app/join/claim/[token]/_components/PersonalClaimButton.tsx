"use client";

import { useActionState } from "react";
import type { PersonalClaimState } from "../_actions/claim-personal-invite";

interface Props {
  token: string;
  action: (prev: PersonalClaimState, formData: FormData) => Promise<PersonalClaimState>;
}

export function PersonalClaimButton({ token, action }: Props) {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      {state?.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-(--color-brand) px-5 py-3 text-sm font-semibold text-white hover:bg-(--color-brand-hover) disabled:opacity-50"
      >
        {isPending ? "Setting up your account…" : "Get Started"}
      </button>
    </form>
  );
}
