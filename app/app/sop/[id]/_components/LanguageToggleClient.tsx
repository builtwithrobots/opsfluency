'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

import type { WorkerLanguage } from '@/lib/types/sop';
import { setLanguagePreference } from '@/app/dashboard/sops/_actions';

interface Props {
  sopId: string;
  current: WorkerLanguage;
}

export function LanguageToggleClient({ sopId, current }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function pick(lang: WorkerLanguage) {
    if (lang === current || isPending) return;
    startTransition(async () => {
      await setLanguagePreference({ language: lang });
      // Bring the URL in line with the new selection so refreshes stay sticky
      // even if the persisted preference write loses the race with a refresh.
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      params.set('lang', lang);
      router.replace(`/app/sop/${sopId}?${params.toString()}`);
      router.refresh();
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
          className={[
            'min-h-[44px] min-w-[44px] rounded-full px-3 py-1.5 text-sm font-semibold transition-colors',
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
