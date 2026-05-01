"use client";

import { useActionState } from "react";
import { ArrowRight, Loader2, Phone, User, Mail } from "lucide-react";

import { createJoinRequest, type JoinRequestState } from "../_actions/create-join-request";

interface Props {
  companyId: string;
  companyName: string;
}

export function JoinRequestForm({ companyId, companyName }: Props) {
  const [state, action, isPending] = useActionState<JoinRequestState, FormData>(
    createJoinRequest,
    null,
  );

  if (state?.status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
          <svg
            className="size-7"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
            Request sent!
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Your manager will be in touch. You&apos;ll receive a personal invite
            link once approved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="company_id" value={companyId} />

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="name-input"
          className="text-sm font-semibold text-zinc-700 dark:text-zinc-300"
        >
          Your name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <User
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
            strokeWidth={2}
          />
          <input
            id="name-input"
            name="name"
            type="text"
            required
            autoFocus
            placeholder="Jane Smith"
            className="w-full rounded-xl border border-zinc-200 bg-white py-3.5 pl-10 pr-4 text-base text-zinc-900 placeholder-zinc-400 focus:border-(--color-brand) focus:outline-none focus:ring-2 focus:ring-(--color-brand)/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
        </div>
      </div>

      {/* Phone */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="phone-input"
          className="text-sm font-semibold text-zinc-700 dark:text-zinc-300"
        >
          Your phone number <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Phone
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
            strokeWidth={2}
          />
          <input
            id="phone-input"
            name="phone"
            type="tel"
            inputMode="numeric"
            required
            placeholder="(555) 123-4567"
            className="w-full rounded-xl border border-zinc-200 bg-white py-3.5 pl-10 pr-4 text-base text-zinc-900 placeholder-zinc-400 focus:border-(--color-brand) focus:outline-none focus:ring-2 focus:ring-(--color-brand)/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
        </div>
      </div>

      {/* Personal email — optional */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email-input"
          className="text-sm font-semibold text-zinc-700 dark:text-zinc-300"
        >
          Personal email{" "}
          <span className="font-normal text-zinc-400">(optional)</span>
        </label>
        <div className="relative">
          <Mail
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
            strokeWidth={2}
          />
          <input
            id="email-input"
            name="email_personal"
            type="email"
            placeholder="jane@gmail.com"
            className="w-full rounded-xl border border-zinc-200 bg-white py-3.5 pl-10 pr-4 text-base text-zinc-900 placeholder-zinc-400 focus:border-(--color-brand) focus:outline-none focus:ring-2 focus:ring-(--color-brand)/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Used for magic-link sign-in once your account is created.
        </p>
      </div>

      {state?.status === "error" && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400"
        >
          {state.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-(--color-brand) py-3.5 text-base font-semibold text-white hover:bg-(--color-brand-hover) focus:outline-none focus:ring-2 focus:ring-(--color-brand)/40 disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" strokeWidth={2} />
            Sending request…
          </>
        ) : (
          <>
            Request access to {companyName}
            <ArrowRight className="size-4" strokeWidth={2.5} />
          </>
        )}
      </button>
    </form>
  );
}
