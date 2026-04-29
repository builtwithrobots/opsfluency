'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Save, Trash2, Video } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { detectEmbed } from '@/lib/qr/embed';
import { updateSopVideoUrl } from '../../_actions';

interface Props {
  sopId: string;
  initialVideoUrl: string | null;
}

function requiresAccountWarning(url: string): boolean {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return (
      h.includes('drive.google.com') ||
      h.includes('docs.google.com') ||
      h.includes('sharepoint.com') ||
      h.includes('onedrive.live.com') ||
      h.includes('microsoftstream.com')
    );
  } catch {
    return false;
  }
}

export function VideoClient({ sopId, initialVideoUrl }: Props) {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl ?? '');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const dirty = videoUrl.trim() !== (initialVideoUrl ?? '');

  const trimmed = videoUrl.trim();
  const embedInfo = (() => {
    if (!trimmed) return null;
    try { return detectEmbed(trimmed); } catch { return null; }
  })();
  const isEmbeddable = embedInfo !== null && embedInfo.provider !== 'generic';
  const showAccountWarning = !!trimmed && requiresAccountWarning(trimmed);

  function save() {
    if (trimmed) {
      try { new URL(trimmed); } catch {
        setError('Enter a valid URL, e.g. https://www.youtube.com/watch?v=...');
        return;
      }
    }
    setError(null);
    startTransition(async () => {
      const r = await updateSopVideoUrl({ sop_id: sopId, video_url: trimmed || null });
      if (!r.ok) {
        setError(r.error.message ?? r.error.code);
        return;
      }
      setSavedAt(new Date());
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-5">
      <div>
        <h2 className="text-base font-semibold text-dc-text">Attached video</h2>
        <p className="mt-1 text-sm text-dc-text-3">
          Paste a YouTube, Loom, or Vimeo URL. Workers see a "Watch video" button in the app
          that opens the video in a pop-up — they can watch without leaving the SOP.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="sop-video-url" className="text-sm font-medium text-dc-text">
          Video URL
        </label>
        <input
          id="sop-video-url"
          type="url"
          value={videoUrl}
          onChange={(e) => { setVideoUrl(e.target.value); setError(null); }}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isPending}
        />
        <p className="text-xs text-dc-text-3">
          YouTube, Loom, and Vimeo URLs embed automatically. Other links open in the browser.
        </p>
      </div>

      {showAccountWarning && (
        <div className="flex items-start gap-2 rounded-md border border-amber-400/30 bg-amber-400/8 px-3 py-2.5">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-500" strokeWidth={2} aria-hidden />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Workers will need a Google or Microsoft account to open this link. Consider uploading
            to YouTube, Loom, or Vimeo instead — those embed directly and require no account.
          </p>
        </div>
      )}

      {isEmbeddable && embedInfo && (
        <div>
          <p className="mb-2 text-xs font-medium text-dc-text-3">Preview</p>
          <div className="relative w-full overflow-hidden rounded-lg" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={embedInfo.embed_url}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Video preview"
              loading="lazy"
            />
          </div>
        </div>
      )}

      {!trimmed && !initialVideoUrl && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-[color:var(--dc-edge)] px-4 py-6 text-sm text-dc-text-3">
          <Video className="size-5 shrink-0" strokeWidth={1.5} aria-hidden />
          No video attached yet. Paste a URL above to add one.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[color:var(--dc-edge)] pt-4">
        {savedAt && !dirty && (
          <span className="text-xs text-dc-text-3">Saved {savedAt.toLocaleTimeString()}</span>
        )}
        {error && (
          <p className="mr-auto text-sm text-(--color-signal-urgent)" role="alert">{error}</p>
        )}
        {(trimmed || initialVideoUrl) && (
          <Button
            plain
            onClick={() => { setVideoUrl(''); setError(null); }}
            disabled={isPending}
          >
            <Trash2 data-slot="icon" strokeWidth={2} />
            Remove video
          </Button>
        )}
        <Button color="brand" onClick={save} disabled={!dirty || isPending}>
          <Save data-slot="icon" strokeWidth={2} />
          {isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
