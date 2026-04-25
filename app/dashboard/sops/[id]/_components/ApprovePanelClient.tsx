'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { approveSop } from '../../_actions';

interface Props {
  sopId: string;
}

export function ApprovePanelClient({ sopId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function publish() {
    setError(null);
    startTransition(async () => {
      const r = await approveSop({ sop_id: sopId });
      if (!r.ok) {
        setError(r.error.message ?? r.error.code);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-(--color-signal-hub) bg-(--color-signal-hub)/5 p-5">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-dc-text">Final review on the worker reader</p>
        <p className="text-xs text-dc-text-3">
          This is exactly what employees see when they scan the QR. Approve when it looks right —
          publishing generates the QR and goes live immediately.
        </p>
      </div>

      <div className="mt-5 flex flex-col items-center gap-5 lg:flex-row lg:items-start">
        {/* Phone-frame iframe at 390x844 (iPhone 12+ logical viewport) */}
        <div className="shrink-0 overflow-hidden rounded-[2rem] border-8 border-zinc-900 bg-zinc-900 shadow-xl">
          <iframe
            title="Worker reader preview"
            src={`/app/sop/${sopId}?preview=1`}
            width={390}
            height={844}
            className="block"
            // sandbox allows scripts and same-origin so Clerk session passes through
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <p className="text-sm text-dc-text-2">
            Spot-check the layout on the iframe to your right. Tap through the EN/ES toggle, scroll
            steps, confirm callouts render correctly. If something&apos;s off, switch to the Spanish
            tab and edit before publishing.
          </p>

          {error && (
            <p role="alert" className="text-sm text-(--color-signal-urgent)">
              {error}
            </p>
          )}

          <Button color="brand" onClick={publish} disabled={isPending}>
            <CheckCircle2 data-slot="icon" strokeWidth={2} />
            {isPending ? 'Publishing…' : 'Approve & publish'}
          </Button>
        </div>
      </div>
    </div>
  );
}
