'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getCompanyContext, AuthError } from '@/lib/auth/company-context';
import { SOP_TEMPLATE } from '@/lib/types/sop';

const INDUSTRY_PACKAGE = ['general', 'iso9001', 'food-safety', 'healthcare'] as const;

// ── Create SOP draft ─────────────────────────────────────────────────────────

const CreateSopSchema = z.object({
  title: z.string().min(1).max(200),
  template: z.enum(SOP_TEMPLATE),
  department_id: z.string().uuid().nullable().optional(),
});

export async function createSop(raw: unknown) {
  try {
    const { userId, supabase, company_id } = await getCompanyContext('manager');
    const input = CreateSopSchema.parse(raw);

    const { data, error } = await supabase
      .from('sops')
      .insert({
        company_id,
        title: input.title,
        template: input.template,
        department_id: input.department_id ?? null,
        status: 'draft',
        created_by: userId,
      })
      .select('id')
      .single();

    if (error) return { ok: false as const, error: { code: 'INTERNAL', message: error.message } };

    revalidatePath('/dashboard/sops');
    return { ok: true as const, data: { id: data.id } };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false as const, error: { code: 'INVALID_INPUT', details: e.issues } };
    if (e instanceof AuthError) return { ok: false as const, error: { code: e.code } };
    throw e;
  }
}

// ── Update industry packages ──────────────────────────────────────────────────

const UpdatePackagesSchema = z.object({
  packages: z.array(z.enum(INDUSTRY_PACKAGE)).min(1, 'At least one package must remain active.'),
});

export async function updateIndustryPackages(raw: unknown) {
  try {
    const { supabase, company_id, role } = await getCompanyContext('admin');
    if (role !== 'admin') return { ok: false as const, error: { code: 'FORBIDDEN' } };

    const input = UpdatePackagesSchema.parse(raw);

    const { error } = await supabase
      .from('companies')
      .update({ industry_packages: input.packages })
      .eq('id', company_id);

    if (error) return { ok: false as const, error: { code: 'INTERNAL', message: error.message } };

    revalidatePath('/dashboard/sops');
    return { ok: true as const };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false as const, error: { code: 'INVALID_INPUT' } };
    if (e instanceof AuthError) return { ok: false as const, error: { code: e.code } };
    throw e;
  }
}

// ── Update active templates ───────────────────────────────────────────────────

const UpdateActiveTemplatesSchema = z.object({
  templates: z.array(z.enum(SOP_TEMPLATE)).min(1, 'At least one template must remain active.'),
});

export async function updateActiveTemplates(raw: unknown) {
  try {
    const { supabase, company_id, role } = await getCompanyContext('admin');
    if (role !== 'admin') return { ok: false as const, error: { code: 'FORBIDDEN' } };

    const input = UpdateActiveTemplatesSchema.parse(raw);

    const { error } = await supabase
      .from('companies')
      .update({ active_sop_templates: input.templates })
      .eq('id', company_id);

    if (error) return { ok: false as const, error: { code: 'INTERNAL', message: error.message } };

    revalidatePath('/dashboard/sops');
    return { ok: true as const };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false as const, error: { code: 'INVALID_INPUT' } };
    if (e instanceof AuthError) return { ok: false as const, error: { code: e.code } };
    throw e;
  }
}
