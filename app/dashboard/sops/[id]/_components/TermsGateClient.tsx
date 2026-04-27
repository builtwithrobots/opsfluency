'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { ArrowRight, BookOpen, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { FlaggedTerm } from '@/lib/ai/sop-conversion';
import { defineFlaggedTerms } from '../../_actions';
import type { ExistingGlossaryEntry } from './ActionBanner';

interface Props {
  sopId: string;
  flaggedTerms: FlaggedTerm[];
  existingGlossary: ExistingGlossaryEntry[];
}

/** Manager's choice when a flagged term collides with an existing glossary entry. */
type Resolution = 'use_new' | 'use_existing' | 'skip';

interface DraftRow {
  term_en: string;
  definition_en: string;
  term_es: string;
  definition_es: string;
  /**
   * Always set, even for non-conflicting rows. Non-conflicts default to
   * `use_new` (insert as a new glossary entry) and the dropdown is
   * hidden — there's nothing to choose. Conflicts default to
   * `use_existing` (the safe option: don't touch the glossary).
   */
  resolution: Resolution;
  /**
   * If a glossary entry already exists for this term (case-insensitive),
   * we capture the row so the comparison panel can render side-by-side.
   * `null` means no conflict.
   */
  existing: ExistingGlossaryEntry | null;
}

export function TermsGateClient({ sopId, flaggedTerms, existingGlossary }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const glossaryByLower = useMemo(() => {
    const map = new Map<string, ExistingGlossaryEntry>();
    for (const g of existingGlossary) map.set(g.term_en.toLowerCase(), g);
    return map;
  }, [existingGlossary]);

  const [terms, setTerms] = useState<DraftRow[]>(() =>
    flaggedTerms.map((t) => {
      const existing = glossaryByLower.get(t.term.toLowerCase()) ?? null;
      return {
        term_en: t.term,
        // Pre-fill from the existing glossary entry when there is one,
        // so flipping to "Use new" gives the manager a sensible starting
        // point rather than empty fields.
        definition_en: existing?.definition_en ?? t.suggested_definition_en ?? '',
        term_es: existing?.term_es ?? t.suggested_term_es ?? '',
        definition_es: existing?.definition_es ?? '',
        resolution: existing ? 'use_existing' : 'use_new',
        existing,
      };
    }),
  );

  const conflictCount = terms.filter((t) => !!t.existing).length;
  const hasUnresolvedConflicts = false; // conflicts always have a default resolution; kept for future custom states.

  function patch(idx: number, patchObj: Partial<DraftRow>) {
    setTerms((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patchObj } : r)));
  }

  function setAllConflicts(resolution: Resolution) {
    setTerms((prev) =>
      prev.map((r) => (r.existing ? { ...r, resolution } : r)),
    );
  }

  // Validation: every row that's actively writing to the glossary
  // (resolution === 'use_new') must have both EN and ES filled in.
  // Rows with use_existing/skip are left alone, so empty fields don't matter.
  const allFilled = terms.every((t) => {
    if (t.resolution !== 'use_new') return true;
    return t.term_en.trim().length > 0 && t.term_es.trim().length > 0;
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!allFilled) {
      setError('Every term you\'re writing needs an English and Spanish value before you can move on.');
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
          resolution: t.resolution,
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
        <div className="flex-1">
          <p className="text-sm font-semibold text-dc-text">
            {terms.length} site-specific term{terms.length === 1 ? '' : 's'} to review
          </p>
          <p className="mt-1 text-xs text-dc-text-2">
            Translation is paused until each flagged term is resolved. New terms get saved to your
            company glossary so future SOPs translate consistently.
            {conflictCount > 0 && (
              <>
                {' '}
                <span className="font-semibold text-dc-text">
                  {conflictCount} already in your glossary
                </span>{' '}
                — pick whether to keep the existing entry or overwrite it.
              </>
            )}
          </p>
        </div>
      </div>

      {/* Bulk resolution actions — only meaningful when there's at least one conflict. */}
      {conflictCount > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-[color:var(--dc-edge)] bg-dc-surface px-3 py-2">
          <span className="mr-1 text-xs font-medium tracking-wide text-dc-text-3 uppercase">
            Bulk:
          </span>
          <button
            type="button"
            onClick={() => setAllConflicts('use_existing')}
            className="rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-1 text-xs font-medium text-dc-text-2 hover:text-dc-text"
          >
            Keep all existing
          </button>
          <button
            type="button"
            onClick={() => setAllConflicts('use_new')}
            className="rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-1 text-xs font-medium text-dc-text-2 hover:text-dc-text"
          >
            Overwrite all with new
          </button>
          <button
            type="button"
            onClick={() => setAllConflicts('skip')}
            className="rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-1 text-xs font-medium text-dc-text-2 hover:text-dc-text"
          >
            Skip all conflicts
          </button>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-4">
        {terms.length === 0 && (
          <p className="text-sm text-dc-text-3">
            Sonnet didn&apos;t flag any new terms. You can move straight to translation.
          </p>
        )}
        {terms.map((row, i) => {
          const meta = flaggedTerms[i];
          return (
            <TermRow
              key={`${meta?.term ?? i}`}
              row={row}
              meta={meta}
              onPatch={(p) => patch(i, p)}
            />
          );
        })}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-(--color-signal-urgent)">
          {error}
        </p>
      )}

      <div className="mt-5 flex justify-end">
        <Button type="submit" color="brand" disabled={isPending || !allFilled || hasUnresolvedConflicts}>
          {isPending ? 'Saving…' : 'Save & continue to translation'}
          <ArrowRight data-slot="icon" strokeWidth={2} />
        </Button>
      </div>
    </form>
  );
}

// ── One row ────────────────────────────────────────────────────────────────

interface TermRowProps {
  row: DraftRow;
  meta?: FlaggedTerm;
  onPatch: (p: Partial<DraftRow>) => void;
}

function TermRow({ row, meta, onPatch }: TermRowProps) {
  const conflict = !!row.existing;
  const editable = row.resolution === 'use_new';

  return (
    <div className={
      'rounded-lg border bg-dc-surface p-4 ' +
      (conflict
        ? 'border-(--color-signal-info)/40 ring-1 ring-(--color-signal-info)/15'
        : 'border-[color:var(--dc-edge)]')
    }>
      {meta?.reason && (
        <p className="mb-3 text-xs text-dc-text-3">
          <span className="font-medium text-dc-text-2">Flagged because:</span> {meta.reason}
        </p>
      )}

      {conflict && row.existing && (
        <ConflictPanel existing={row.existing} meta={meta} resolution={row.resolution} onPatch={onPatch} />
      )}

      {/* The editable form. Hidden when the manager keeps the existing
          entry or skips the term — those resolutions don't write anything,
          so editing fields would be misleading. */}
      {editable && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-dc-text-2">English term</label>
            <input
              type="text"
              value={row.term_en}
              onChange={(e) => onPatch({ term_en: e.target.value })}
              className="w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text focus:border-(--color-brand) focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dc-text-2">Spanish term</label>
            <input
              type="text"
              value={row.term_es}
              onChange={(e) => onPatch({ term_es: e.target.value })}
              className="w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text focus:border-(--color-brand) focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dc-text-2">EN definition (optional)</label>
            <textarea
              value={row.definition_en}
              onChange={(e) => onPatch({ definition_en: e.target.value })}
              rows={2}
              className="w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text focus:border-(--color-brand) focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dc-text-2">ES definition (optional)</label>
            <textarea
              value={row.definition_es}
              onChange={(e) => onPatch({ definition_es: e.target.value })}
              rows={2}
              className="w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text focus:border-(--color-brand) focus:outline-none"
            />
          </div>
        </div>
      )}

      {!conflict && !editable && (
        // Should never happen for non-conflicts (their default resolution
        // is use_new). Render-time fallback so the row isn't ghostly empty.
        <p className="mt-2 text-xs text-dc-text-3">This term will be skipped.</p>
      )}
    </div>
  );
}

// ── Conflict comparison + per-row resolution picker ────────────────────────

interface ConflictPanelProps {
  existing: ExistingGlossaryEntry;
  meta?: FlaggedTerm;
  resolution: Resolution;
  onPatch: (p: Partial<DraftRow>) => void;
}

function ConflictPanel({ existing, meta, resolution, onPatch }: ConflictPanelProps) {
  return (
    <div className="rounded-md border border-(--color-signal-info)/30 bg-(--color-signal-info)/5 p-3">
      <div className="flex items-center gap-2">
        <BookOpen className="size-4 text-(--color-signal-info)" strokeWidth={2} aria-hidden />
        <p className="text-xs font-semibold text-dc-text">
          Already in your glossary
        </p>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <CompareCard heading="Existing entry">
          <DefRow label="EN term" value={existing.term_en} />
          <DefRow label="ES term" value={existing.term_es} />
          {existing.definition_en && <DefRow label="EN definition" value={existing.definition_en} multiline />}
          {existing.definition_es && <DefRow label="ES definition" value={existing.definition_es} multiline />}
        </CompareCard>
        <CompareCard heading="From this SOP">
          <DefRow label="EN term" value={meta?.term ?? '—'} />
          <DefRow label="Suggested ES" value={meta?.suggested_term_es ?? '—'} />
          {meta?.suggested_definition_en && (
            <DefRow label="Suggested EN definition" value={meta.suggested_definition_en} multiline />
          )}
          {meta?.reason && <DefRow label="Why flagged" value={meta.reason} multiline subtle />}
        </CompareCard>
      </div>

      <fieldset className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <legend className="mr-1 text-dc-text-3 uppercase">For this term:</legend>
        <ResolutionPill
          checked={resolution === 'use_existing'}
          label="Keep existing"
          onSelect={() => onPatch({ resolution: 'use_existing' })}
        />
        <ResolutionPill
          checked={resolution === 'use_new'}
          label="Overwrite with new"
          onSelect={() => onPatch({ resolution: 'use_new' })}
        />
        <ResolutionPill
          checked={resolution === 'skip'}
          label="Skip"
          onSelect={() => onPatch({ resolution: 'skip' })}
        />
      </fieldset>
    </div>
  );
}

function ResolutionPill({
  checked,
  label,
  onSelect,
}: {
  checked: boolean;
  label: string;
  onSelect: () => void;
}) {
  return (
    <label className={
      'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 font-medium transition-colors ' +
      (checked
        ? 'border-(--color-brand) bg-(--color-brand) text-white'
        : 'border-[color:var(--dc-edge)] bg-dc-raised text-dc-text-2 hover:text-dc-text')
    }>
      <input
        type="radio"
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      {label}
    </label>
  );
}

function CompareCard({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-[color:var(--dc-edge)] bg-dc-base p-3">
      <p className="mb-2 text-[10px] font-semibold tracking-[0.1em] text-dc-text-3 uppercase">
        {heading}
      </p>
      <dl className="flex flex-col gap-1.5 text-xs">{children}</dl>
    </div>
  );
}

function DefRow({
  label,
  value,
  multiline = false,
  subtle = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  subtle?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[10px] font-medium tracking-wide text-dc-text-3 uppercase">{label}</dt>
      <dd className={
        (subtle ? 'italic text-dc-text-3 ' : 'text-dc-text ') +
        (multiline ? 'whitespace-pre-wrap leading-relaxed' : 'truncate')
      }>
        {value}
      </dd>
    </div>
  );
}
