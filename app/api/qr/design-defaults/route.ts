import { NextResponse } from 'next/server';
import { z } from 'zod';

import { AuthError, getCompanyContext } from '@/lib/auth/company-context';

/**
 * Org-wide QR print design defaults. Admin-only.
 *
 * Stored as JSONB on companies.qr_design_defaults — see
 * supabase/migrations/20260426000001_qr_design_defaults.sql. The shape is a
 * Partial<PrintConfig>; we don't enforce the schema in zod beyond "object of
 * unknown" so the API doesn't drift every time PrintConfig grows a field.
 */
const UpdateInput = z.object({
  print_config: z.record(z.string(), z.unknown()),
});

export async function GET() {
  try {
    const { supabase, company_id } = await getCompanyContext();

    const { data, error } = await supabase
      .from('companies')
      .select('qr_design_defaults')
      .eq('id', company_id)
      .single();

    if (error) return fail(500, 'INTERNAL', error.message);
    return NextResponse.json({ data: data?.qr_design_defaults ?? {} });
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(request: Request) {
  try {
    const { supabase, company_id } = await getCompanyContext('admin');
    const body   = await request.json();
    const parsed = UpdateInput.parse(body);

    const { data, error } = await supabase
      .from('companies')
      .update({ qr_design_defaults: parsed.print_config })
      .eq('id', company_id)
      .select('qr_design_defaults')
      .single();

    if (error) return fail(500, 'INTERNAL', error.message);
    return NextResponse.json({ data: data?.qr_design_defaults ?? {} });
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
