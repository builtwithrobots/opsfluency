import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { AuthError, getCompanyContext } from '@/lib/auth/company-context';
import { detectEmbed } from '@/lib/qr/embed';
import { passesAudience, isAudienceUnrestricted, type QrAudience } from '@/lib/qr/audience';
import { ExternalLinkView } from '@/components/app/ExternalLinkView';

interface Props {
  searchParams: Promise<{
    qr?: string;
    preview?: string;
    url?: string;
    label?: string;
  }>;
}

export const metadata: Metadata = { robots: 'noindex' };

/**
 * In-app wrapper for QR codes that point at an external URL. Two modes:
 *
 *   - `?qr=<id>` — production scan path. Reached via `/s/[qr_code_id]`
 *     for `target_type === 'url'`; re-checks the audience as defense in
 *     depth (the page is linkable directly, so the /s gate may not have
 *     run for this request).
 *
 *   - `?preview=1&url=<url>&label=<label>` — manager-only builder path.
 *     The QR builder iframes this URL inside its device-preview frame so
 *     the creator sees the *live* /app/external chrome (real back arrow,
 *     real BottomNav from /app/layout, real iframe of the destination)
 *     before the QR is created. No DB lookup, no audience check —
 *     manager auth is the gate.
 *
 * The embed rewrite (YouTube/Loom → /embed) is decided by `detectEmbed`;
 * this page only owns auth + audience.
 */
export default async function ExternalLinkPage({ searchParams }: Props) {
  const params = await searchParams;

  if (params.preview === '1') {
    return previewMode(params);
  }

  return scanMode(params);
}

async function previewMode(params: {
  url?: string;
  label?: string;
}) {
  // Manager-gated: only managers and admins can render arbitrary URLs
  // inside our chrome. `getCompanyContext('manager')` throws FORBIDDEN
  // for employees, which we surface as a 404 to keep the surface small.
  try {
    await getCompanyContext('manager');
  } catch (e) {
    if (e instanceof AuthError) notFound();
    throw e;
  }

  const raw = (params.url ?? '').trim();
  if (!raw) notFound();

  // URL parser is the cheapest validator we can rely on; the embed
  // helper is more lenient (it returns provider='generic' on parse
  // failure), so an explicit check keeps obviously-broken inputs out.
  try {
    new URL(raw);
  } catch {
    notFound();
  }

  const embed = detectEmbed(raw);
  const label = (params.label ?? '').trim();

  return (
    <div className="h-[calc(100dvh-5rem)] min-h-0">
      <ExternalLinkView label={label} embed={embed} />
    </div>
  );
}

async function scanMode(params: { qr?: string }) {
  const qr_code_id = params.qr;
  if (!qr_code_id) notFound();

  const { supabase, userId, company_id, role } = await getCompanyContext();

  // RLS scopes this select to the caller's company. A QR id from another
  // tenant therefore returns no row → 404, which is the right behaviour
  // for direct hits with a foreign id.
  const { data: qr } = await supabase
    .from('qr_codes')
    .select('id, label, target_type, target_url, audience_department_ids, audience_roles')
    .eq('id', qr_code_id)
    .maybeSingle();

  if (!qr) notFound();
  if (qr.target_type !== 'url' || !qr.target_url) notFound();

  // Audience re-check. /s/[qr_code_id] also runs this — duplicating it here
  // costs one query and closes the direct-link bypass.
  const audience: QrAudience = {
    department_ids: (qr.audience_department_ids ?? []) as string[],
    roles:          (qr.audience_roles          ?? []) as ('admin' | 'manager' | 'employee')[],
  };

  if (!isAudienceUnrestricted(audience) && role !== 'admin') {
    const { data: member } = await supabase
      .from('company_members')
      .select('id')
      .eq('clerk_user_id', userId)
      .eq('company_id', company_id)
      .maybeSingle();

    const { data: deptRows } = member
      ? await supabase
          .from('employee_departments')
          .select('department_id')
          .eq('member_id', member.id)
      : { data: [] as { department_id: string }[] };

    const scanner = {
      role,
      department_ids: (deptRows ?? []).map((r) => r.department_id as string),
    };

    if (!passesAudience(audience, scanner)) {
      // Bounce through /s/<id> so the friendly AccessDeniedView renders
      // rather than ours; that page already owns the deny experience.
      redirect(`/s/${qr_code_id}`);
    }
  }

  const embed = detectEmbed(qr.target_url);

  return (
    <div className="h-[calc(100dvh-5rem)] min-h-0">
      <ExternalLinkView label={qr.label ?? ''} embed={embed} />
    </div>
  );
}
