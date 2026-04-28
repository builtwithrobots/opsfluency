import { createHash } from 'crypto';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';

import { resolveQrTarget } from '@/lib/qr/resolve';
import { passesAudience, isAudienceUnrestricted } from '@/lib/qr/audience';
import { getAdminClient } from '@/lib/supabase/admin';
import { isRateLimited } from '@/lib/qr/rate-limit';
import { AccessDeniedView } from '@/components/qr/AccessDeniedView';
import QrGone from './gone';

interface Props {
  params: Promise<{ qr_code_id: string }>;
}

export const metadata: Metadata = { robots: 'noindex' };

export default async function QrScanPage({ params }: Props) {
  const { qr_code_id } = await params;
  const result = await resolveQrTarget(qr_code_id);

  if (result.status === 'not_found') notFound();
  if (result.status === 'archived') return <QrGone />;

  const { qr, destination } = result;

  const { userId } = await auth();

  // Unauthenticated path: send to sign-in with the scan URL preserved as the
  // post-login redirect so the audience check runs after Clerk hands the user
  // back to us. We never let an unauthenticated scan through, even when the
  // audience is empty — the company decides who their QRs are for.
  if (!userId) {
    const back = `/s/${qr_code_id}`;
    redirect(`/sign-in?redirect_url=${encodeURIComponent(back)}`);
  }

  // Log the scan directly via the admin client before any redirect().
  // A fire-and-forget fetch() was used here previously, but redirect() throws
  // a Next.js NEXT_REDIRECT error that aborts the process before the fetch
  // completes — scans were silently dropped. Awaiting a direct DB insert
  // adds ~10-30 ms but guarantees the row lands.
  const hdrs = await headers();
  const ip =
    hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    hdrs.get('x-real-ip') ??
    'unknown';
  const ipHash = createHash('sha256').update(ip).digest('hex');

  if (!isRateLimited(ipHash, qr_code_id)) {
    const admin = getAdminClient();
    const { error: scanErr } = await admin.from('qr_scans').insert({
      qr_code_id,
      company_id: qr.company_id,
      scanned_by: userId ?? null,
      ip_hash: ipHash,
      user_agent: hdrs.get('user-agent') ?? null,
    });
    if (scanErr) {
      console.error('[qr-scan] insert failed:', scanErr.code, scanErr.message);
    }
  }

  // Audience gate. Resolve the scanner's role + departments, then run the
  // shared `passesAudience` check. Admins always pass; super-admins pass via
  // the same admin branch (they get role='admin' through impersonation, or
  // we explicitly recognise them here when they're not impersonating).
  const audience = {
    department_ids: (qr.audience_department_ids ?? []) as string[],
    roles:          (qr.audience_roles          ?? []) as ('admin' | 'manager' | 'employee')[],
  };

  if (isAudienceUnrestricted(audience)) {
    redirect(destinationFor(qr, qr_code_id, destination));
  }

  // Admin client: scan landing has no Clerk JWT → Supabase is treating us
  // as anon. We only read membership for the gate, never write.
  const admin = getAdminClient();
  const [{ data: member }, { data: superRow }] = await Promise.all([
    admin
      .from('company_members')
      .select('id, role, company_id')
      .eq('clerk_user_id', userId)
      .eq('company_id', qr.company_id)
      .maybeSingle(),
    admin
      .from('super_admins')
      .select('id')
      .eq('clerk_user_id', userId)
      .maybeSingle(),
  ]);

  if (superRow) redirect(destinationFor(qr, qr_code_id, destination));

  if (!member) {
    return (
      <ScanShell>
        <AccessDeniedView
          qr_code_id={qr_code_id}
          label={qr.label || undefined}
          audience_summary={summariseAudience(audience)}
        />
      </ScanShell>
    );
  }

  const { data: deptRows } = await admin
    .from('employee_departments')
    .select('department_id')
    .eq('member_id', member.id);

  const scanner = {
    role: member.role as 'admin' | 'manager' | 'employee',
    department_ids: (deptRows ?? []).map((r) => r.department_id as string),
  };

  if (passesAudience(audience, scanner)) {
    redirect(destinationFor(qr, qr_code_id, destination));
  }

  return (
    <ScanShell>
      <AccessDeniedView
        qr_code_id={qr_code_id}
        label={qr.label || undefined}
        audience_summary={summariseAudience(audience)}
      />
    </ScanShell>
  );
}

function ScanShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-dc-base px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-sm">
        {children}
      </div>
    </main>
  );
}

/**
 * Picks the post-gate redirect target. URL-type QR codes route through the
 * in-app `/app/external` wrapper so workers stay inside the OpsFluency
 * chrome and can navigate back to Home via the BottomNav. Every other
 * target type keeps using the destination resolved by `resolveQrTarget`.
 */
function destinationFor(
  qr: { target_type: string },
  qr_code_id: string,
  destination: string,
): string {
  if (qr.target_type === 'url') return `/app/external?qr=${qr_code_id}`;
  return destination;
}

function summariseAudience(a: { department_ids: string[]; roles: string[] }) {
  const bits: string[] = [];
  if (a.roles.length) {
    const human = a.roles.map((r) => (r === 'employee' ? 'Workers' : r === 'manager' ? 'Managers' : 'Admins'));
    bits.push(human.join(', '));
  }
  if (a.department_ids.length) {
    bits.push(`${a.department_ids.length} department${a.department_ids.length === 1 ? '' : 's'}`);
  }
  return bits.length ? `For ${bits.join(' · ')}` : '';
}
