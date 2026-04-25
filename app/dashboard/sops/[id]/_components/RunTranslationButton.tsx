'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Languages } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { runTranslation } from '../../_actions';
import { JobError, JobProgress } from './JobFeedback';

interface Props {
  sopId: string;
  disabled?: boolean;
}

interface ErrorState {
  code: string;
  message?: string;
  details?: unknown;
}

const TRANSLATION_STAGES = [
  { at_ms: 0,      label: 'Substituting glossary terms with placeholders…' },
  { at_ms: 1_500,  label: 'Sending to Google Translate…' },
  { at_ms: 5_000,  label: 'Translating Markdown — preserving structure and callouts…' },
  { at_ms: 20_000, label: 'Restoring glossary terms in the Spanish version…' },
  { at_ms: 45_000, label: 'Still working…' },
];

export function RunTranslationButton({ sopId, disabled }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<ErrorState | null>(null);

  function go() {
    setError(null);
    startTransition(async () => {
      const r = await runTranslation({ sop_id: sopId });
      if (!r.ok) {
        setError({ code: r.error.code, message: r.error.message, details: r.error.details });
        return;
      }
      router.refresh();
    });
  }

  if (isPending) {
    return (
      <div className="flex w-full flex-col gap-3">
        <JobProgress
          headline="Translating to Spanish with glossary injection"
          expectedMs={15_000}
          stages={TRANSLATION_STAGES}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex w-full flex-col gap-3">
        <JobError
          code={error.code}
          message={error.message}
          details={error.details}
          context={{ sop_id: sopId, action: 'runTranslation' }}
          onRetry={go}
        />
      </div>
    );
  }

  return (
    <Button color="brand" onClick={go} disabled={disabled}>
      <Languages data-slot="icon" strokeWidth={2} />
      Run translation
    </Button>
  );
}
