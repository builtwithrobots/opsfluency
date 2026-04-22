import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';

import { resolveQrTarget } from '@/lib/qr/resolve';
import QrGone from './gone';

interface Props {
  params: Promise<{ qr_code_id: string }>;
}

export const metadata: Metadata = { robots: 'noindex' };

export default async function QrScanPage({ params }: Props) {
  const { qr_code_id } = await params;
  const result = await resolveQrTarget(qr_code_id);

  if (result.status === 'not_found') notFound();

  if (result.status === 'archived') {
    // HTTP 410 Gone — content intentionally removed.
    return <QrGone />;
  }

  // Fire-and-forget scan log. Don't await — we don't want latency on the redirect.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  void fetch(`${appUrl}/api/qr/scans`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ qr_code_id }),
    // next: { revalidate: 0 } — not needed on a server component, just fire it
  }).catch(() => {/* best-effort; never block the redirect */});

  const { userId } = await auth();
  const destination = result.destination;

  if (userId) {
    redirect(destination);
  } else {
    redirect(`/sign-in?redirect_url=${encodeURIComponent(destination)}`);
  }
}
