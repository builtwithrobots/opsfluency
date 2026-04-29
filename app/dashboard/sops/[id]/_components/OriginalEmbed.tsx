import { getAdminClient } from '@/lib/supabase/admin';

interface Props {
  bucket: string;
  path: string;
}

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1h per CLAUDE.md

/**
 * Renders the original uploaded file in-page with a 1-hour signed URL.
 * Admin client because the bucket policy gates by JWT-derived
 * `requesting_company_id()`; here we already verified tenant scope and
 * want a deterministic short-lived URL — service-role keeps it simple.
 */
export async function OriginalEmbed({ bucket, path }: Props) {
  const admin = getAdminClient();
  const filename = path.split('/').pop() ?? 'document';

  const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) {
    return (
      <div className="rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface px-6 py-10 text-center text-sm text-(--color-signal-urgent)">
        Could not load the original file: {error?.message ?? 'unknown error'}
      </div>
    );
  }

  const url = data.signedUrl;
  const lower = filename.toLowerCase();
  const isPdf = lower.endsWith('.pdf');
  const isImage = /\.(jpe?g|png|heic|heif|gif|webp)$/.test(lower);
  const isText = lower.endsWith('.txt');

  if (isPdf) {
    return (
      <iframe
        src={url}
        title={`Original PDF: ${filename}`}
        className="block h-[80vh] w-full rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface"
      >
        <p className="p-4 text-sm text-dc-text-3">
          PDF preview unavailable —
          {' '}
          <a href={url} className="text-(--color-brand) hover:underline" target="_blank" rel="noreferrer">
            open in a new tab
          </a>
          .
        </p>
      </iframe>
    );
  }

  if (isImage) {
    return (
      <div className="overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={`Original image: ${filename}`} className="mx-auto block max-h-[80vh] object-contain" />
      </div>
    );
  }

  if (isText) {
    const res = await fetch(url, { cache: 'no-store' });
    const text = await res.text();
    return (
      <pre className="block max-h-[80vh] overflow-auto rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-5 font-mono text-sm leading-relaxed whitespace-pre-wrap text-dc-text">
        {text}
      </pre>
    );
  }

  return (
    <div className="rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-6 text-sm text-dc-text-3">
      Preview not supported for this file type.{' '}
      <a href={url} className="text-(--color-brand) hover:underline" target="_blank" rel="noreferrer">
        Download {filename}
      </a>
    </div>
  );
}
