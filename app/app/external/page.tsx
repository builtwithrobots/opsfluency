import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { getCompanyContext } from '@/lib/auth/company-context';
import { detectEmbed } from '@/lib/qr/embed';
import { passesAudience, isAudienceUnrestricted, type QrAudience } from '@/lib/qr/audience';
import { ExternalLinkView } from '@/components/app/ExternalLinkView';

interface Props {
  searchParams: Promise<{ qr?: string }>;
}

export const metadata: Metadata = { robots: 'noindex' };

/**
 * In-app wrapper for QR codes that point at an external URL. Reached via
 * `/s/[qr_code_id]` for `target_type === 'url'` scans and re-checks the
 * audience as defense in depth: the page is also linkable directly, so
 * we can't rely on the /s gate having already run.
 *
 * The actual embed (YouTube/Loom rewrite vs. generic iframe) is decided
 * by `detectEmbed`; this page only owns auth + audience.
 */
export default async function ExternalLinkPage({ searchParams }: Props) {
  const { qr: qr_code_id } = await searchParams;
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

  // 100dvh - 80px (BottomNav from /app/layout) is the visible area for
  // /app/* pages. ExternalLinkView itself fills its parent so it can
  // also be embedded inside the QR builder's device preview at a
  // different height.
  return (
    <div className="h-[calc(100dvh-5rem)] min-h-0">
      <ExternalLinkView label={qr.label ?? ''} embed={embed} />
    </div>
  );
}
