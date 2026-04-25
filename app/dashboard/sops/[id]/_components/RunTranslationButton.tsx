'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Languages } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { runTranslation } from '../../_actions';

interface Props {
  sopId: string;
  disabled?: boolean;
}

export function RunTranslationButton({ sopId, disabled }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function go() {
    setError(null);
    startTransition(async () => {
      const r = await runTranslation({ sop_id: sopId });
      if (!r.ok) {
        setError(r.error.message ?? r.error.code);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button color="brand" onClick={go} disabled={disabled || isPending}>
        <Languages data-slot="icon" strokeWidth={2} />
        {isPending ? 'Translating…' : 'Run translation'}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-(--color-signal-urgent)">
          {error}
        </p>
      )}
    </div>
  );
}
