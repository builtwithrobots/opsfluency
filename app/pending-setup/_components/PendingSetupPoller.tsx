'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';

interface Props {
  companyName: string;
}

export default function PendingSetupPoller({ companyName }: Props) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(id);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-dc-bg px-4">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <span
          aria-hidden
          className="flex size-16 items-center justify-center rounded-full bg-(--color-brand)/10 text-(--color-brand)"
        >
          <Clock className="size-8" strokeWidth={1.5} />
        </span>

        <div>
          <h1 className="text-2xl font-semibold text-dc-text">
            Account setup in progress
          </h1>
          <p className="mt-3 text-sm text-dc-text-2">
            Your account at{' '}
            <span className="font-medium text-dc-text">{companyName}</span> is
            active, but you haven&apos;t been assigned to a department yet.
          </p>
          <p className="mt-2 text-sm text-dc-text-3">
            Ask your admin to assign your department in Org Settings. This page
            checks automatically every 30 seconds.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-dc-text-3">
          <span
            aria-hidden
            className="size-1.5 animate-pulse rounded-full bg-(--color-brand)"
          />
          Waiting for department assignment…
        </div>
      </div>
    </div>
  );
}
