"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { useTransition } from "react";

interface Props {
  label: string;
}

export function SignOutClient({ label }: Props) {
  const { signOut } = useClerk();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (isPending) return;
    startTransition(async () => {
      await signOut({ redirectUrl: "/sign-in" });
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl border border-dc-edge bg-dc-surface px-4 py-3 text-base font-semibold text-dc-text transition-colors hover:bg-dc-raised disabled:opacity-50"
    >
      <LogOut className="size-5" strokeWidth={2} aria-hidden />
      {label}
    </button>
  );
}
