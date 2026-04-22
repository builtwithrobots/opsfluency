'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { QrTargetType } from '@/lib/qr/print-config';

const TARGET_TYPES: { value: QrTargetType; label: string; description: string }[] = [
  { value: 'sop',           label: 'SOP',           description: 'Links to a standard operating procedure' },
  { value: 'announcement',  label: 'Announcement',  description: 'Links to a company announcement' },
  { value: 'questionnaire', label: 'Questionnaire', description: 'Links to a form or survey' },
  { value: 'url',           label: 'Custom URL',    description: 'Links to any external or internal URL' },
];

export default function NewQrForm() {
  const router   = useRouter();
  const [type,   setType]   = useState<QrTargetType>('sop');
  const [label,  setLabel]  = useState('');
  const [url,    setUrl]    = useState('');
  const [error,  setError]  = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const body: Record<string, string> = { target_type: type, label };
    if (type === 'url') body.target_url = url;

    const res  = await fetch('/api/qr', {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const json = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(json?.error?.message ?? 'Failed to create QR code');
      return;
    }

    router.push(`/dashboard/qr/${json.data.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-6">
      {/* Target type */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-neutral-300">Target type</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TARGET_TYPES.map(t => (
            <label
              key={t.value}
              className={[
                'flex cursor-pointer flex-col gap-1 rounded-lg border p-3 transition-colors',
                type === t.value
                  ? 'border-(--color-brand) bg-(--color-brand)/10'
                  : 'border-neutral-700 hover:border-neutral-500',
              ].join(' ')}
            >
              <input
                type="radio"
                name="target_type"
                value={t.value}
                checked={type === t.value}
                onChange={() => setType(t.value)}
                className="sr-only"
              />
              <span className="text-sm font-semibold text-neutral-100">{t.label}</span>
              <span className="text-xs text-neutral-400">{t.description}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Label */}
      <div>
        <label htmlFor="qr-label" className="mb-1 block text-sm font-medium text-neutral-300">
          Label <span className="text-neutral-500">(optional)</span>
        </label>
        <input
          id="qr-label"
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          maxLength={200}
          placeholder="e.g. Forklift Safety — Bay 3"
          className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:border-neutral-500 focus:outline-none"
        />
      </div>

      {/* URL — only shown for url type */}
      {type === 'url' && (
        <div>
          <label htmlFor="qr-url" className="mb-1 block text-sm font-medium text-neutral-300">
            Destination URL <span className="text-red-400">*</span>
          </label>
          <input
            id="qr-url"
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            required={type === 'url'}
            placeholder="https://example.com/procedure"
            className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:border-neutral-500 focus:outline-none"
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400" role="alert">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-(--color-brand) px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-(--color-brand)/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Creating…' : 'Create QR code →'}
      </button>
    </form>
  );
}
