'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { runConversion } from '../../_actions';
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

const CONVERSION_STAGES = [
  { at_ms: 0,       label: 'Reading the uploaded document…' },
  { at_ms: 4_000,   label: 'Sending to Claude Sonnet…' },
  { at_ms: 8_000,   label: 'Analyzing structure — headings, steps, callouts…' },
  { at_ms: 25_000,  label: 'Identifying site-specific terminology…' },
  { at_ms: 45_000,  label: 'Document is large — processing in sections…' },
  { at_ms: 90_000,  label: 'Almost there — finalizing the response…' },
  { at_ms: 150_000, label: 'Still working — large or scanned PDFs can take a while.' },
];

export function RunConversionButton({ sopId, disabled }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<ErrorState | null>(null);

  function go() {
    setError(null);
    startTransition(async () => {
      const r = await runConversion({ sop_id: sopId });
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
          headline="Claude is converting your document"
          expectedMs={120_000}
          stages={CONVERSION_STAGES}
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
          context={{ sop_id: sopId, action: 'runConversion' }}
          onRetry={go}
        />
      </div>
    );
  }

  return (
    <Button color="brand" onClick={go} disabled={disabled}>
      <Sparkles data-slot="icon" strokeWidth={2} />
      Run conversion
    </Button>
  );
}
