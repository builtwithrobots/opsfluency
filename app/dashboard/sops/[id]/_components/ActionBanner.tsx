import { ArrowRight, ExternalLink, Sparkles } from 'lucide-react';

import type { SopStatus } from '@/lib/types/sop';
import type { FlaggedTerm } from '@/lib/ai/sop-conversion';
import { Button } from '@/components/ui/button';

import { RunConversionButton } from './RunConversionButton';
import { TermsGateClient } from './TermsGateClient';
import { RunTranslationButton } from './RunTranslationButton';

export interface ExistingGlossaryEntry {
  id: string;
  term_en: string;
  definition_en: string | null;
  term_es: string;
  definition_es: string | null;
}

interface ActionBannerProps {
  sopId: string;
  status: SopStatus;
  latestVersion: {
    id: string;
    version_number: number;
    flagged_terms: FlaggedTerm[] | null;
    original_file_url: string | null;
    content_en: string | null;
    content_es: string | null;
  } | null;
  qrCodeId: string | null;
  existingGlossary?: ExistingGlossaryEntry[];
}

export function ActionBanner({ sopId, status, latestVersion, qrCodeId, existingGlossary = [] }: ActionBannerProps) {
  if (status === 'draft') {
    return (
      <div className="rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface px-5 py-4">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 size-5 text-(--color-brand)" strokeWidth={1.5} aria-hidden />
          <div className="flex-1">
            <p className="text-sm font-semibold text-dc-text">Document uploaded — ready to convert</p>
            <p className="mt-1 text-xs text-dc-text-3">
              Claude reads the file, builds Markdown, and flags any site-specific terminology.
              Typical run: 20–60 seconds.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <RunConversionButton sopId={sopId} disabled={!latestVersion?.original_file_url} />
        </div>
      </div>
    );
  }

  if (status === 'pending_terms') {
    return (
      <TermsGateClient
        sopId={sopId}
        flaggedTerms={latestVersion?.flagged_terms ?? []}
        existingGlossary={existingGlossary}
      />
    );
  }

  if (status === 'pending_translation') {
    return (
      <div className="rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-dc-text">Glossary locked in — ready to translate &amp; publish</p>
          <p className="mt-1 text-xs text-dc-text-3">
            Google Translate runs once with your glossary injected, then the SOP goes live and the
            QR is generated. You can edit Spanish post-publish from the Spanish tab.
          </p>
        </div>
        <div className="mt-4">
          <RunTranslationButton sopId={sopId} disabled={!latestVersion?.content_en} />
        </div>
      </div>
    );
  }

  if (status === 'published') {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-(--color-signal-ok) bg-(--color-signal-ok)/5 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-(--color-signal-ok)">Live for workers</p>
          <p className="mt-1 text-xs text-dc-text-3">
            QR codes resolve to the latest published version. Edit and re-upload at any time.
          </p>
        </div>
        {qrCodeId && (
          <Button href={`/dashboard/sops/${sopId}?tab=qr`} plain>
            Open QR
            <ArrowRight data-slot="icon" strokeWidth={2} />
          </Button>
        )}
      </div>
    );
  }

  if (status === 'archived') {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface/50 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-dc-text-2">Archived</p>
          <p className="mt-1 text-xs text-dc-text-3">
            QR scans return a &ldquo;no longer available&rdquo; page. Restore by creating a new SOP.
          </p>
        </div>
        {qrCodeId && (
          <Button href={`/s/${qrCodeId}`} plain>
            View archived page
            <ExternalLink data-slot="icon" strokeWidth={2} />
          </Button>
        )}
      </div>
    );
  }

  return null;
}
