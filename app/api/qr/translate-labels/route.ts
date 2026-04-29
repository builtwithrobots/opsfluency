import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCompanyContext, AuthError } from '@/lib/auth/company-context';
import { translateMarkdown } from '@/lib/translation/google';
import type { GlossaryRow } from '@/lib/types/glossary';

const Body = z.object({
  header:     z.string().min(1).optional(),
  sub_header: z.string().min(1).optional(),
  footer:     z.string().min(1).optional(),
  footer2:    z.string().min(1).optional(),
  tagline:    z.string().min(1).optional(),
});

const FIELDS = ['header', 'sub_header', 'footer', 'footer2', 'tagline'] as const;
type Field = (typeof FIELDS)[number];

export async function POST(request: Request) {
  try {
    const { supabase, company_id } = await getCompanyContext('manager');
    const body = Body.parse(await request.json());

    const { data: glossaryRows } = await supabase
      .from('glossary_terms')
      .select('term_en, definition_en, term_es, definition_es')
      .eq('company_id', company_id)
      .is('deleted_at', null);

    const glossary = (glossaryRows ?? []) as GlossaryRow[];

    const toTranslate = FIELDS.filter((f): f is Field => !!body[f]);
    if (toTranslate.length === 0) {
      return NextResponse.json({ data: {} });
    }

    const results = await Promise.all(
      toTranslate.map(f =>
        translateMarkdown({
          markdown: body[f]!,
          source: 'en',
          target: 'es',
          glossary,
          companyId: company_id,
        }),
      ),
    );

    const data: Partial<Record<`${Field}_es`, string>> = {};
    for (let i = 0; i < toTranslate.length; i++) {
      const result = results[i];
      if (result.ok) {
        data[`${toTranslate[i]}_es`] = result.translated;
      }
    }

    return NextResponse.json({ data });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json(
        { error: { code: e.code } },
        { status: e.code === 'UNAUTHENTICATED' ? 401 : 403 },
      );
    }
    throw e;
  }
}
