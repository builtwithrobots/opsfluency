'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Archive } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { archiveSop } from '../../_actions';

interface Props {
  sopId: string;
}

export function ArchiveButton({ sopId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function go() {
    if (!confirm('Archive this SOP? Workers scanning the QR will see "no longer available". This is reversible only by creating a new SOP.')) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await archiveSop({ sop_id: sopId });
      if (!r.ok) {
        setError(r.error.message ?? r.error.code);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button plain onClick={go} disabled={isPending}>
        <Archive data-slot="icon" strokeWidth={2} />
        {isPending ? 'Archiving…' : 'Archive'}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-(--color-signal-urgent)">{error}</p>
      )}
    </div>
  );
}
