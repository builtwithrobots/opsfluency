'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { JobError, ConversionProgress } from './JobFeedback';

interface Props {
  sopId: string;
  disabled?: boolean;
}

interface ErrorState {
  code: string;
  message?: string;
  details?: unknown;
}

export interface ConversionProgressState {
  phase: 'converting' | 'flagging';
  chunksDone: number;
  chunksTotal: number;
  currentLabel: string;
  elapsedMs: number;
}

export function RunConversionButton({ sopId, disabled }: Props) {
  const router = useRouter();
  const [progress, setProgress] = useState<ConversionProgressState | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const startRef = useRef<number>(0);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopElapsedTimer = useCallback(() => {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  const go = useCallback(async () => {
    setError(null);
    setProgress({
      phase: 'converting',
      chunksDone: 0,
      chunksTotal: 1,
      currentLabel: 'Reading the uploaded document…',
      elapsedMs: 0,
    });

    const abort = new AbortController();
    abortRef.current = abort;
    startRef.current = Date.now();

    // Tick elapsed time every 200ms for the ETA chip.
    elapsedTimerRef.current = setInterval(() => {
      setProgress((prev) =>
        prev ? { ...prev, elapsedMs: Date.now() - startRef.current } : prev,
      );
    }, 200);

    try {
      const response = await fetch(`/api/sops/${sopId}/convert`, {
        method: 'POST',
        signal: abort.signal,
      });

      // Auth and pre-flight errors come back as plain JSON before the stream.
      if (!response.ok || !response.body) {
        const body = await response.json().catch(() => ({})) as { error?: { code?: string; message?: string } };
        const err = body?.error ?? {};
        stopElapsedTimer();
        setProgress(null);
        setError({ code: err.code ?? 'INTERNAL', message: err.message });
        return;
      }

      // Parse the SSE stream line-by-line.
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let lastEvent = '';

      outer: while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            lastEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            let payload: Record<string, unknown>;
            try {
              payload = JSON.parse(line.slice(6)) as Record<string, unknown>;
            } catch {
              continue;
            }

            switch (lastEvent) {
              case 'chunk_start':
                setProgress((prev) => ({
                  phase: 'converting',
                  chunksDone: (prev?.chunksDone ?? 0),
                  chunksTotal: (payload.total as number) ?? 1,
                  currentLabel: (payload.label as string) || 'Processing…',
                  elapsedMs: Date.now() - startRef.current,
                }));
                break;

              case 'chunk_done':
                setProgress((prev) => ({
                  phase: 'converting',
                  chunksDone: (payload.chunk as number) ?? 1,
                  chunksTotal: (payload.total as number) ?? 1,
                  currentLabel: prev?.currentLabel ?? '',
                  elapsedMs: Date.now() - startRef.current,
                }));
                break;

              case 'flagging_start':
                setProgress((prev) => ({
                  phase: 'flagging',
                  chunksDone: prev?.chunksTotal ?? 1,
                  chunksTotal: prev?.chunksTotal ?? 1,
                  currentLabel: 'Identifying site-specific terminology…',
                  elapsedMs: Date.now() - startRef.current,
                }));
                break;

              case 'done':
                stopElapsedTimer();
                setProgress(null);
                router.refresh();
                break outer;

              case 'error': {
                stopElapsedTimer();
                setProgress(null);
                setError({
                  code: (payload.code as string) ?? 'INTERNAL',
                  message: payload.message as string | undefined,
                  details: payload,
                });
                break outer;
              }
            }
          }
        }
      }
    } catch (e) {
      stopElapsedTimer();
      setProgress(null);
      // AbortError fires when user navigates away — don't show error.
      if (e instanceof Error && e.name === 'AbortError') return;
      setError({ code: 'INTERNAL', message: e instanceof Error ? e.message : undefined });
    }
  }, [sopId, router, stopElapsedTimer]);

  if (progress) {
    return (
      <div className="flex w-full flex-col gap-3">
        <ConversionProgress progress={progress} />
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
