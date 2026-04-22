'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
        <legend className="mb-2 text-sm font-medium text-dc-text-2">Target type</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TARGET_TYPES.map(t => (
            <label
              key={t.value}
              className={[
                'flex cursor-pointer flex-col gap-1 rounded-xl border p-3 transition-colors',
                type === t.value
                  ? 'border-(--color-brand) bg-(--color-brand)/10'
                  : 'border-[color:var(--dc-edge)] hover:border-[color:var(--dc-edge-2)]',
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
              <span className="text-sm font-semibold text-dc-text">{t.label}</span>
              <span className="text-xs text-dc-text-3">{t.description}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Label */}
      <div>
        <label htmlFor="qr-label" className="mb-1 block text-sm font-medium text-dc-text-2">
          Label <span className="text-dc-text-3">(optional)</span>
        </label>
        <input
          id="qr-label"
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          maxLength={200}
          placeholder="e.g. Forklift Safety — Bay 3"
          className="w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-[color:var(--dc-edge-2)] focus:outline-none"
        />
      </div>

      {/* URL — only shown for url type */}
      {type === 'url' && (
        <div>
          <label htmlFor="qr-url" className="mb-1 block text-sm font-medium text-dc-text-2">
            Destination URL{' '}
            <span className="text-(--color-signal-urgent)" aria-label="required">*</span>
          </label>
          <input
            id="qr-url"
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            required={type === 'url'}
            placeholder="https://example.com/procedure"
            className="w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-[color:var(--dc-edge-2)] focus:outline-none"
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-(--color-signal-urgent)" role="alert">{error}</p>
      )}

      <Button type="submit" color="brand" disabled={loading}>
        {loading ? 'Creating…' : 'Create QR code'}
      </Button>
    </form>
  );
}
