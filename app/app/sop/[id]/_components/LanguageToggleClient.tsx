'use client';

import { useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

import type { WorkerLanguage } from '@/lib/types/sop';
import { setLanguagePreference } from '@/app/dashboard/sops/_actions';

interface Props {
  sopId: string;
  current: WorkerLanguage;
}

export function LanguageToggleClient({ sopId, current }: Props) {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function pick(lang: WorkerLanguage) {
    if (lang === current || isPending) return;
    startTransition(async () => {
      // Persist the preference for next visit (best-effort — a failure here
      // shouldn't block the navigation; the URL ?lang= param drives the
      // current render either way).
      await setLanguagePreference({ language: lang });

      const params = new URLSearchParams(searchParams?.toString() ?? '');
      params.set('lang', lang);

      // Hard navigate via window.location instead of router.replace +
      // router.refresh(). The /app/sop/[id] route is rendered inside a
      // sandboxed iframe on the manager dashboard's "App view" tab; in that
      // context router.refresh() doesn't reliably re-fetch the RSC payload,
      // so the toggle would persist and update the URL but the rendered
      // content would stay in the previous language. A full reload is ~200ms
      // on a page this small and is correct in both iframe and standalone
      // (worker phone) contexts.
      window.location.replace(`/app/sop/${sopId}?${params.toString()}`);
    });
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex shrink-0 rounded-full border border-[color:var(--dc-edge)] bg-dc-raised p-0.5"
    >
      {(['en', 'es'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => pick(l)}
          aria-pressed={current === l}
          // Visible pill is compact; before-pseudo expands the hit area
          // to 44x44 so glove taps still work. Don't drop the pseudo.
          className={[
            "relative flex h-8 min-w-9 items-center justify-center rounded-full px-2.5 text-xs font-semibold transition-colors",
            "before:absolute before:inset-x-0 before:-inset-y-1.5 before:content-['']",
            current === l
              ? 'bg-(--color-brand) text-white'
              : 'text-dc-text-2 hover:text-dc-text',
          ].join(' ')}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
