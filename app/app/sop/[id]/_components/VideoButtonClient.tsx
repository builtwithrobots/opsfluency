'use client';

import { useState } from 'react';
import { ExternalLink, PlayCircle } from 'lucide-react';

import { Dialog, DialogBody, DialogTitle } from '@/components/ui/dialog';
import { detectEmbed } from '@/lib/qr/embed';
import type { WorkerLanguage } from '@/lib/types/sop';

interface Props {
  videoUrl: string;
  sopTitle: string;
  lang: WorkerLanguage;
}

export function VideoButtonClient({ videoUrl, sopTitle, lang }: Props) {
  const [open, setOpen] = useState(false);

  const embed = detectEmbed(videoUrl);
  const isEmbeddable = embed.provider !== 'generic';
  const label = lang === 'es' ? 'Ver video' : 'Watch video';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-(--color-brand)/30 bg-(--color-brand)/10 px-4 py-2.5 text-sm font-semibold text-(--color-brand) hover:bg-(--color-brand)/20 active:bg-(--color-brand)/30 transition-colors"
        aria-label={label}
      >
        <PlayCircle className="size-5 shrink-0" strokeWidth={1.75} aria-hidden />
        {label}
      </button>

      <Dialog open={open} onClose={setOpen} size="3xl">
        <DialogTitle>{sopTitle}</DialogTitle>
        <DialogBody>
          {isEmbeddable ? (
            <div className="relative w-full overflow-hidden rounded-lg" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={embed.embed_url}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={sopTitle}
                loading="lazy"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <p className="text-sm text-dc-text-2">
                {lang === 'es'
                  ? 'Este video no se puede mostrar aquí. Ábrelo en el navegador.'
                  : "This video can't be embedded here. Open it in your browser."}
              </p>
              <a
                href={embed.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-(--color-brand)/30 bg-(--color-brand)/10 px-5 py-3 text-sm font-semibold text-(--color-brand) hover:bg-(--color-brand)/20 transition-colors"
              >
                <ExternalLink className="size-4 shrink-0" aria-hidden />
                {lang === 'es' ? 'Abrir en navegador' : 'Open in browser'}
              </a>
            </div>
          )}
        </DialogBody>
      </Dialog>
    </>
  );
}
