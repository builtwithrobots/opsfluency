import { NextResponse } from 'next/server';

import { AuthError, getCompanyContext } from '@/lib/auth/company-context';
import { canModifyQr } from '@/lib/qr/audience';
import { getCreatorScope } from '@/lib/qr/creator-scope';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { supabase, company_id, userId, role, impersonating } = await getCompanyContext('manager');

    const { data: qr } = await supabase
      .from('qr_codes')
      .select('id, created_by, archived_at')
      .eq('id', id)
      .eq('company_id', company_id)
      .maybeSingle();

    if (!qr) return fail(404, 'NOT_FOUND');

    const scope = await getCreatorScope({ supabase, userId, company_id, role, impersonating });
    if (!canModifyQr({ qr, userId, scope })) return fail(403, 'FORBIDDEN');

    if (!qr.archived_at) {
      return NextResponse.json({ ok: true, already_active: true });
    }

    const { error } = await supabase
      .from('qr_codes')
      .update({ archived_at: null })
      .eq('id', id)
      .eq('company_id', company_id);

    if (error) return fail(500, 'INTERNAL', error.message);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

function fail(status: number, code: string, message?: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function handleError(e: unknown) {
  if (e instanceof AuthError) {
    if (e.code === 'UNAUTHENTICATED') return fail(401, e.code);
    return fail(403, e.code);
  }
  throw e;
}
