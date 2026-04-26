import { NextResponse } from 'next/server';
import { z } from 'zod';

import { AuthError, getCompanyContext } from '@/lib/auth/company-context';
import { createQrCode } from '@/lib/qr/generate';
import { getCreatorScope } from '@/lib/qr/creator-scope';
import { isWithinCreatorScope } from '@/lib/qr/audience';
import { validateScheduleInput } from '@/lib/qr/schedule';

const RoleSchema = z.enum(['admin', 'manager', 'employee']);

// ISO datetime string accepted by `new Date(...)`. We validate the
// pairwise constraint (until > from, target_type != sop) below.
const Iso = z.string().datetime({ offset: true }).or(z.string().datetime());

const CreateQrInput = z.object({
  target_type: z.enum(['sop', 'announcement', 'questionnaire', 'url']),
  target_id:   z.string().uuid().optional(),
  target_url:  z.string().url().optional(),
  label:       z.string().max(200).optional(),
  audience: z.object({
    department_ids: z.array(z.string().uuid()).default([]),
    roles:          z.array(RoleSchema).default([]),
  }).default({ department_ids: [], roles: [] }),
  active_from:  Iso.nullish(),
  active_until: Iso.nullish(),
}).refine(
  d => d.target_type === 'url' ? !!d.target_url : !!d.target_id,
  { message: 'target_id required unless target_type is url; target_url required for url type' },
).refine(
  d => d.target_type !== 'sop' || (!d.active_from && !d.active_until),
  { message: 'SOP QR codes cannot be scheduled' },
);

export async function POST(request: Request) {
  try {
    const ctx = await getCompanyContext('manager');
    const { supabase, company_id, userId, role, impersonating } = ctx;
    const body   = await request.json();
    const parsed = CreateQrInput.parse(body);

    // Server-side enforcement: a department manager can't target departments
    // they don't belong to or assign roles above their pay grade. Admins and
    // HR managers come back as `unrestricted` and skip the check.
    const scope = await getCreatorScope({ supabase, userId, company_id, role, impersonating });
    if (!isWithinCreatorScope(parsed.audience, scope)) {
      return fail(403, 'FORBIDDEN', 'audience targets a department or role outside your scope');
    }

    // Schedule sanity (until > from). Zod handles per-field shape; this
    // catches the cross-field case the schema can't express ergonomically.
    const scheduleErr = validateScheduleInput({
      active_from:  parsed.active_from,
      active_until: parsed.active_until,
    });
    if (scheduleErr) return fail(400, 'INVALID_INPUT', scheduleErr);

    // Fetch company phone (footer2 default) + org-wide design defaults.
    const { data: company } = await supabase
      .from('companies')
      .select('phone, qr_design_defaults')
      .eq('id', company_id)
      .single();

    const qr = await createQrCode({
      supabase,
      company_id,
      created_by:              userId,
      target_type:             parsed.target_type,
      target_id:               parsed.target_id,
      target_url:              parsed.target_url,
      label:                   parsed.label,
      audience:                parsed.audience,
      active_from:             parsed.active_from  ?? null,
      active_until:            parsed.active_until ?? null,
      company_phone:           company?.phone,
      company_design_defaults: company?.qr_design_defaults ?? null,
    });

    return NextResponse.json({ data: qr }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

export async function GET(request: Request) {
  try {
    const { supabase, company_id } = await getCompanyContext();

    const url     = new URL(request.url);
    const type    = url.searchParams.get('target_type');
    const page    = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
    const limit   = 50;
    const offset  = (page - 1) * limit;

    let query = supabase
      .from('qr_codes')
      .select('*', { count: 'exact' })
      .eq('company_id', company_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) query = query.eq('target_type', type);

    const { data, error, count } = await query;
    if (error) return fail(500, 'INTERNAL', error.message);

    return NextResponse.json({ data, count });
  } catch (e) {
    return handleError(e);
  }
}

function fail(status: number, code: string, message?: string, details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

function handleError(e: unknown) {
  if (e instanceof z.ZodError) return fail(400, 'INVALID_INPUT', undefined, e.issues);
  if (e instanceof AuthError) {
    if (e.code === 'UNAUTHENTICATED') return fail(401, e.code);
    return fail(403, e.code);
  }
  throw e;
}
