import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getAdminClient } from '@/lib/supabase/admin';
import { isRateLimited } from '@/lib/qr/rate-limit';

const ScanInput = z.object({
  qr_code_id: z.string().uuid(),
  scanned_by: z.string().optional(), // clerk_user_id; may be absent pre-auth
});

export async function POST(request: Request) {
  try {
    const body   = await request.json();
    const parsed = ScanInput.parse(body);

    // Hash the IP for rate-limiting without retaining PII.
    const ip     = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
                ?? request.headers.get('x-real-ip')
                ?? 'unknown';
    const ipHash = createHash('sha256').update(ip).digest('hex');

    if (isRateLimited(ipHash, parsed.qr_code_id)) {
      return NextResponse.json(
        { error: { code: 'RATE_LIMITED' } },
        { status: 429 },
      );
    }

    // Admin client: RLS bypass justified — this route accepts unauthenticated
    // calls (scan happens before the employee has a Clerk session).
    const admin = getAdminClient();

    // Resolve company_id from the QR row so we can denormalize onto qr_scans.
    const { data: qr } = await admin
      .from('qr_codes')
      .select('company_id')
      .eq('id', parsed.qr_code_id)
      .single();

    if (!qr) return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });

    await admin.from('qr_scans').insert({
      qr_code_id: parsed.qr_code_id,
      company_id: qr.company_id,
      scanned_by: parsed.scanned_by ?? null,
      ip_hash:    ipHash,
      user_agent: request.headers.get('user-agent') ?? null,
    });

    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', details: e.issues } },
        { status: 400 },
      );
    }
    throw e;
  }
}
