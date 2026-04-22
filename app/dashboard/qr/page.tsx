import { ExternalLink, QrCode, ScanLine } from 'lucide-react';

import { getCompanyContext } from '@/lib/auth/company-context';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { QrTargetType } from '@/lib/qr/print-config';

const TYPE_LABELS: Record<QrTargetType, string> = {
  sop:           'SOP',
  announcement:  'Announcement',
  questionnaire: 'Questionnaire',
  url:           'URL',
};

export default async function QrCodesPage() {
  const { supabase, company_id } = await getCompanyContext('manager');

  const { data: qrCodes } = await supabase
    .from('qr_codes')
    .select('id, label, target_type, created_at')
    .eq('company_id', company_id)
    .order('created_at', { ascending: false });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.15em] text-(--color-brand) uppercase">
            QR Codes
          </p>
          <Heading className="font-display mt-2">QR Code library</Heading>
          <Text className="mt-2 max-w-2xl">
            Each QR code has a permanent scan URL. Attach them to SOPs,
            announcements, or any destination. Print and post — they never expire.
          </Text>
        </div>
        <Button href="/dashboard/qr/new" color="brand">
          <QrCode data-slot="icon" strokeWidth={2} />
          New QR code
        </Button>
      </header>

      {!qrCodes?.length ? (
        <QrEmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {qrCodes.map((qr, i) => (
            <QrCard
              key={qr.id}
              qr={qr}
              appUrl={appUrl}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Empty state ────────────────────────────────────────────────── */

function QrEmptyState() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-8 shadow-xs">
      {/* Ambient blob — matches EmptyActivityCard pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-(--color-brand) opacity-10 blur-3xl"
      />
      <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <span
          aria-hidden
          className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-(--color-brand)/10 text-(--color-brand)"
        >
          <QrCode className="size-7" strokeWidth={1.5} />
        </span>
        <div>
          <p className="font-display text-sm tracking-[0.15em] text-(--color-brand) uppercase">
            Getting started
          </p>
          <h3 className="mt-1 text-xl font-semibold text-dc-text">
            No QR codes yet
          </h3>
          <p className="mt-1 max-w-md text-dc-text-2">
            Create a QR code and print it to any surface. The URL never changes — scans always
            resolve to the current content.
          </p>
          <Button href="/dashboard/qr/new" color="brand" className="mt-5">
            <QrCode data-slot="icon" strokeWidth={2} />
            Create your first QR code
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── QR card ────────────────────────────────────────────────────── */

interface QrCardProps {
  qr: { id: string; label: string; target_type: string; created_at: string };
  appUrl: string;
  index: number;
}

function QrCard({ qr, appUrl, index }: QrCardProps) {
  const scanUrl = `${appUrl}/s/${qr.id}`;

  return (
    <div
      className="group relative flex flex-col gap-4 rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-5 shadow-xs transition-shadow hover:shadow-md"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Top row: icon + type badge */}
      <div className="flex items-start justify-between">
        <span
          aria-hidden
          className="flex size-9 items-center justify-center rounded-lg bg-(--color-brand)/10 text-(--color-brand)"
        >
          <QrCode className="size-4" strokeWidth={2} />
        </span>
        <Badge color="zinc">
          {TYPE_LABELS[qr.target_type as QrTargetType] ?? qr.target_type}
        </Badge>
      </div>

      {/* Label */}
      <div className="flex-1">
        <p className="font-semibold text-dc-text">
          {qr.label || <span className="italic text-dc-text-3">Unlabelled</span>}
        </p>
        <a
          href={scanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-dc-text-3 hover:text-(--color-brand)"
        >
          /s/{qr.id.slice(0, 8)}…
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Footer row: date + action */}
      <div className="flex items-center justify-between border-t border-[color:var(--dc-edge)] pt-3">
        <div className="flex items-center gap-1.5 text-xs text-dc-text-3">
          <ScanLine className="h-3.5 w-3.5" />
          {new Date(qr.created_at).toLocaleDateString()}
        </div>
        <Button href={`/dashboard/qr/${qr.id}`} plain className="text-sm">
          Edit / Print
        </Button>
      </div>

      {/* Brand underline that grows on hover — matches stat-card pattern */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 rounded-b-xl bg-(--color-brand) transition-transform duration-200 group-hover:scale-x-100"
      />
    </div>
  );
}
