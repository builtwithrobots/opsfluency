'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ArrowRight, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { FlaggedTerm } from '@/lib/ai/sop-conversion';
import { defineFlaggedTerms } from '../../_actions';

interface Props {
  sopId: string;
  flaggedTerms: FlaggedTerm[];
}

interface DraftRow {
  term_en: string;
  definition_en: string;
  term_es: string;
  definition_es: string;
}

export function TermsGateClient({ sopId, flaggedTerms }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [terms, setTerms] = useState<DraftRow[]>(() =>
    flaggedTerms.map((t) => ({
      term_en: t.term,
      definition_en: t.suggested_definition_en ?? '',
      term_es: t.suggested_term_es ?? '',
      definition_es: '',
    })),
  );

  function patch(idx: number, patchObj: Partial<DraftRow>) {
    setTerms((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patchObj } : r)));
  }

  const allFilled = terms.every((t) => t.term_en.trim() && t.term_es.trim());

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!allFilled) {
      setError('Every term needs both an English and a Spanish translation before you can move on.');
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await defineFlaggedTerms({
        sop_id: sopId,
        terms: terms.map((t) => ({
          term_en: t.term_en.trim(),
          definition_en: t.definition_en.trim() || null,
          term_es: t.term_es.trim(),
          definition_es: t.definition_es.trim() || null,
        })),
      });
      if (!r.ok) {
        setError(r.error.message ?? r.error.code);
        return;
      }
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-(--color-signal-warn) bg-(--color-signal-warn)/5 p-5"
    >
      <div className="flex items-start gap-3">
        <Lock className="mt-0.5 size-5 shrink-0 text-(--color-signal-warn)" strokeWidth={1.5} aria-hidden />
        <div>
          <p className="text-sm font-semibold text-dc-text">
            {terms.length} site-specific term{terms.length === 1 ? '' : 's'} to define
          </p>
          <p className="mt-1 text-xs text-dc-text-2">
            Translation is paused until every flagged term has a Spanish equivalent. These get saved
            to your company glossary so future SOPs translate consistently.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {terms.length === 0 && (
          <p className="text-sm text-dc-text-3">
            Sonnet didn&apos;t flag any new terms. You can move straight to translation.
          </p>
        )}
        {terms.map((row, i) => {
          const meta = flaggedTerms[i];
          return (
            <div
              key={`${meta?.term ?? i}`}
              className="rounded-lg border border-[color:var(--dc-edge)] bg-dc-surface p-4"
            >
              {meta?.reason && (
                <p className="mb-3 text-xs text-dc-text-3">
                  <span className="font-medium text-dc-text-2">Flagged because:</span> {meta.reason}
                </p>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-dc-text-2">English term</label>
                  <input
                    type="text"
                    value={row.term_en}
                    onChange={(e) => patch(i, { term_en: e.target.value })}
                    className="w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text focus:border-(--color-brand) focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-dc-text-2">Spanish term</label>
                  <input
                    type="text"
                    value={row.term_es}
                    onChange={(e) => patch(i, { term_es: e.target.value })}
                    className="w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text focus:border-(--color-brand) focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-dc-text-2">EN definition (optional)</label>
                  <textarea
                    value={row.definition_en}
                    onChange={(e) => patch(i, { definition_en: e.target.value })}
                    rows={2}
                    className="w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text focus:border-(--color-brand) focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-dc-text-2">ES definition (optional)</label>
                  <textarea
                    value={row.definition_es}
                    onChange={(e) => patch(i, { definition_es: e.target.value })}
                    rows={2}
                    className="w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text focus:border-(--color-brand) focus:outline-none"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-(--color-signal-urgent)">
          {error}
        </p>
      )}

      <div className="mt-5 flex justify-end">
        <Button type="submit" color="brand" disabled={isPending || !allFilled}>
          {isPending ? 'Saving…' : 'Save & continue to translation'}
          <ArrowRight data-slot="icon" strokeWidth={2} />
        </Button>
      </div>
    </form>
  );
}
