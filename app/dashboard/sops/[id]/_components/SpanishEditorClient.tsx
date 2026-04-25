'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Save, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { renderMarkdown } from '@/lib/sop/markdown';
import { saveSpanishEdit } from '../../_actions';

interface Props {
  sopId: string;
  initialContent: string;
  needsRetranslation: boolean;
}

export function SpanishEditorClient({ sopId, initialContent, needsRetranslation }: Props) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [view, setView] = useState<'edit' | 'preview'>('edit');
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dirty = content !== initialContent;

  function save() {
    setError(null);
    startTransition(async () => {
      const r = await saveSpanishEdit({ sop_id: sopId, content_es: content });
      if (!r.ok) {
        setError(r.error.message ?? r.error.code);
        return;
      }
      setSavedAt(new Date());
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface">
      {needsRetranslation && (
        <div
          className="flex items-start gap-2 rounded-t-xl border-b border-(--color-signal-warn) bg-(--color-signal-warn)/10 px-5 py-3"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-(--color-signal-warn)" strokeWidth={2} aria-hidden />
          <p className="text-xs text-dc-text-2">
            English content changed since the last translation. Re-run translation or edit Spanish manually.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-[color:var(--dc-edge)] px-5 py-3">
        <div className="flex gap-1 rounded-lg bg-dc-raised p-1">
          <button
            type="button"
            onClick={() => setView('edit')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              view === 'edit' ? 'bg-(--color-brand) text-white' : 'text-dc-text-3 hover:text-dc-text'
            }`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setView('preview')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              view === 'preview' ? 'bg-(--color-brand) text-white' : 'text-dc-text-3 hover:text-dc-text'
            }`}
          >
            Preview
          </button>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && !dirty && (
            <span className="text-xs text-dc-text-3">
              Saved {savedAt.toLocaleTimeString()}
            </span>
          )}
          <Button color="brand" onClick={save} disabled={!dirty || isPending}>
            <Save data-slot="icon" strokeWidth={2} />
            {isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {view === 'edit' ? (
        <textarea
          lang="es"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="block min-h-[60vh] w-full resize-y rounded-b-xl bg-dc-surface px-5 py-4 font-mono text-sm leading-relaxed text-dc-text focus:outline-none"
          spellCheck={false}
        />
      ) : (
        <article lang="es" className="px-6 py-4">
          {renderMarkdown(content, { className: 'max-w-none' })}
        </article>
      )}

      {error && (
        <p role="alert" className="border-t border-[color:var(--dc-edge)] px-5 py-3 text-sm text-(--color-signal-urgent)">
          {error}
        </p>
      )}
    </div>
  );
}
