import clsx from 'clsx';
import { Check } from 'lucide-react';

import type { SopStatus } from '@/lib/types/sop';

const STAGES: { key: 'upload' | 'terms' | 'translate' | 'published'; label: string }[] = [
  { key: 'upload',    label: 'Upload' },
  { key: 'terms',     label: 'Terms' },
  { key: 'translate', label: 'Translate' },
  { key: 'published', label: 'Published' },
];

function stageIndexFor(status: SopStatus): number {
  switch (status) {
    case 'draft':                return 1;  // upload done, terms next
    case 'pending_terms':        return 1;
    case 'pending_translation':  return 2;
    // pending_approval is retired but still in the enum for legacy data —
    // any row that lands there should sit at the Translate stage so the
    // user knows the manual gate is gone.
    case 'pending_approval':     return 2;
    case 'published':            return 3;
    case 'archived':             return 3;
  }
}

export function StageRail({ status }: { status: SopStatus }) {
  const currentIdx = stageIndexFor(status);
  const archived = status === 'archived';

  return (
    <ol
      aria-label="SOP pipeline stages"
      className="flex items-center gap-2 overflow-x-auto rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-3"
    >
      {STAGES.map((s, i) => {
        const done = i < currentIdx && !archived;
        const active = i === currentIdx && !archived;
        return (
          <li key={s.key} className="flex items-center gap-2">
            <div
              className={clsx(
                'flex items-center gap-2 rounded-lg px-3 py-1.5',
                done && 'bg-(--color-signal-ok)/10 text-(--color-signal-ok)',
                active && 'bg-(--color-brand)/10 text-(--color-brand)',
                !done && !active && 'text-dc-text-3',
              )}
            >
              <span
                className={clsx(
                  'flex size-5 items-center justify-center rounded-full text-xs font-bold',
                  done && 'bg-(--color-signal-ok) text-white',
                  active && 'bg-(--color-brand) text-white',
                  !done && !active && 'bg-dc-raised text-dc-text-3',
                )}
                aria-hidden
              >
                {done ? <Check className="size-3" strokeWidth={3} /> : i + 1}
              </span>
              <span className="whitespace-nowrap text-sm font-medium">{s.label}</span>
            </div>
            {i < STAGES.length - 1 && (
              <span
                aria-hidden
                className={clsx(
                  'h-px w-6 shrink-0',
                  i < currentIdx - 1 && !archived ? 'bg-(--color-signal-ok)' : 'bg-[color:var(--dc-edge)]',
                )}
              />
            )}
          </li>
        );
      })}
      {archived && (
        <li className="ml-auto rounded-lg bg-(--color-signal-neutral)/10 px-3 py-1.5 text-xs font-medium text-(--color-signal-neutral)">
          Archived
        </li>
      )}
    </ol>
  );
}
