import Link from 'next/link';
import { QrCode, ExternalLink } from 'lucide-react';

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
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-700 py-20 text-center">
          <QrCode className="mb-4 h-10 w-10 text-neutral-600" strokeWidth={1.5} />
          <p className="text-base font-medium text-neutral-300">No QR codes yet</p>
          <Text className="mt-1 max-w-xs">
            Create your first QR code and print it to start tracking scans.
          </Text>
          <Button href="/dashboard/qr/new" color="brand" className="mt-6">
            Create QR code
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-800">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-800 bg-neutral-900/60">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-neutral-400">Label</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-400">Type</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-400">Scan URL</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-400">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {qrCodes.map(qr => (
                <tr key={qr.id} className="hover:bg-neutral-900/40">
                  <td className="px-4 py-3 font-medium text-neutral-100">
                    {qr.label || <span className="text-neutral-500 italic">Unlabelled</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge color="zinc">
                      {TYPE_LABELS[qr.target_type as QrTargetType] ?? qr.target_type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`${appUrl}/s/${qr.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-white"
                    >
                      /s/{qr.id.slice(0, 8)}…
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="px-4 py-3 text-neutral-400">
                    {new Date(qr.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/qr/${qr.id}`}
                      className="text-sm text-(--color-brand) hover:underline"
                    >
                      Edit / Print
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
