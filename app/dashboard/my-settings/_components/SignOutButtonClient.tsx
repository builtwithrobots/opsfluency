"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { useTransition } from "react";

export function SignOutButtonClient() {
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
      className="inline-flex items-center gap-1.5 rounded-md border border-(--color-signal-urgent)/30 bg-(--color-signal-urgent)/10 px-4 py-2 text-xs font-semibold tracking-wide text-(--color-signal-urgent) uppercase hover:bg-(--color-signal-urgent)/20 disabled:opacity-60"
    >
      <LogOut className="size-3.5" strokeWidth={2} aria-hidden />
      {isPending ? "Signing out…" : "Sign out"}
    </button>
  );
}
