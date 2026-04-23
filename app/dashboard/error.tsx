'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: Props) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <span
        aria-hidden
        className="flex size-14 items-center justify-center rounded-xl bg-(--color-signal-urgent)/10 text-(--color-signal-urgent)"
      >
        <AlertTriangle className="size-7" strokeWidth={1.5} />
      </span>

      <div>
        <h2 className="text-lg font-semibold text-dc-text">Something went wrong</h2>
        <p className="mt-1 max-w-sm text-sm text-dc-text-2">
          This page ran into an unexpected error. Try refreshing — if it keeps
          happening, contact your workspace admin.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-dc-text-3">
            Error ref: {error.digest}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={reset} color="brand">
          Try again
        </Button>
        <Button href="/dashboard" plain>
          Go to home
        </Button>
      </div>
    </div>
  );
}
