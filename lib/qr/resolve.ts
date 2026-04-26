import 'server-only';

import { getAdminClient } from '@/lib/supabase/admin';
import type { QrCodeRow } from './generate';

export type ResolveResult =
  | { status: 'found';    qr: QrCodeRow; destination: string }
  | { status: 'archived'; qr: QrCodeRow }
  | { status: 'not_found' };

/**
 * Resolves a QR scan to a destination URL.
 *
 * Uses the admin client because the scan landing (/s/[id]) is a public route
 * with no Clerk session - we need to read qr_codes without an authenticated
 * JWT. RLS bypass is intentional here; the route only exposes a redirect
 * target, not tenant content.
 */
export async function resolveQrTarget(qrCodeId: string): Promise<ResolveResult> {
  // Admin client: RLS bypass justified - public scan route has no Clerk session.
  const admin = getAdminClient();

  const { data: qr, error } = await admin
    .from('qr_codes')
    .select('*')
    .eq('id', qrCodeId)
    .single();

  if (error || !qr) return { status: 'not_found' };

  // QR-level archive: a manager moved this QR into the archive. Render the
  // same Gone page workers see when an SOP is archived — the URL is still
  // a permanent identifier, just intentionally retired.
  if (qr.archived_at) return { status: 'archived', qr: qr as QrCodeRow };

  // Scheduling window: if the QR has an active_from / active_until and
  // we're outside it, treat the same as archived for the scan flow. The
  // library card UI distinguishes "Inactive · Date Range" from "Archived"
  // for managers; workers see the same friendly Gone page either way.
  const now = new Date();
  if (qr.active_from && now < new Date(qr.active_from as string)) {
    return { status: 'archived', qr: qr as QrCodeRow };
  }
  if (qr.active_until && now >= new Date(qr.active_until as string)) {
    return { status: 'archived', qr: qr as QrCodeRow };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  switch (qr.target_type as string) {
    case 'sop': {
      const { data: sop } = await admin
        .from('sops')
        .select('id, status')
        .eq('id', qr.target_id)
        .single();

      if (!sop) return { status: 'not_found' };
      if (sop.status === 'archived') return { status: 'archived', qr: qr as QrCodeRow };

      return {
        status:      'found',
        qr:          qr as QrCodeRow,
        destination: `${appUrl}/app/sop/${sop.id}`,
      };
    }

    case 'url': {
      if (!qr.target_url) return { status: 'not_found' };
      return { status: 'found', qr: qr as QrCodeRow, destination: qr.target_url as string };
    }

    // announcement / questionnaire: stub for now - resolve once those modules land.
    case 'announcement':
    case 'questionnaire':
    default:
      return {
        status:      'found',
        qr:          qr as QrCodeRow,
        destination: `${appUrl}/app/home`,
      };
  }
}
