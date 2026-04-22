import { NextResponse } from 'next/server';
import { z } from 'zod';

import { AuthError, getCompanyContext } from '@/lib/auth/company-context';

const UpdateQrInput = z.object({
  label:        z.string().max(200).optional(),
  print_config: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { supabase, company_id } = await getCompanyContext();

    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('id', id)
      .eq('company_id', company_id)
      .single();

    if (error || !data) return fail(404, 'NOT_FOUND');
    return NextResponse.json({ data });
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { supabase, company_id } = await getCompanyContext('manager');
    const body   = await request.json();
    const parsed = UpdateQrInput.parse(body);

    const { data, error } = await supabase
      .from('qr_codes')
      .update(parsed)
      .eq('id', id)
      .eq('company_id', company_id)
      .select()
      .single();

    if (error) return fail(500, 'INTERNAL', error.message);
    if (!data)  return fail(404, 'NOT_FOUND');

    return NextResponse.json({ data });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { supabase, company_id } = await getCompanyContext('admin');

    const { error } = await supabase
      .from('qr_codes')
      .delete()
      .eq('id', id)
      .eq('company_id', company_id);

    if (error) return fail(500, 'INTERNAL', error.message);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return handleError(e);
  }
}

function fail(status: number, code: string, message?: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function handleError(e: unknown) {
  if (e instanceof z.ZodError) return fail(400, 'INVALID_INPUT', JSON.stringify(e.issues));
  if (e instanceof AuthError) {
    if (e.code === 'UNAUTHENTICATED') return fail(401, e.code);
    return fail(403, e.code);
  }
  throw e;
}
