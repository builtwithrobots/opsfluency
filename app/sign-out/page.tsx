"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Hard sign-out that works even when the dashboard / app shell is
 * erroring. The UserButton lives inside the shell and isn't reachable
 * when the shell throws, so we keep a no-frills escape hatch at a
 * stable URL.
 */
export default function SignOutPage() {
  const { signOut } = useClerk();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await signOut({ redirectUrl: "/sign-in" });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [signOut, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-dc-bg px-6 py-16">
      <div className="flex max-w-sm flex-col gap-3 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-dc-text">
          Signing you out…
        </h1>
        <p className="text-sm text-dc-text-2">
          {error ? `Something went wrong: ${error}` : "You'll be redirected to sign-in shortly."}
        </p>
      </div>
    </div>
  );
}
