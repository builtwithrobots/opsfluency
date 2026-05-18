import { notFound, redirect } from 'next/navigation';

import { AuthError, getCompanyContext, type Role } from '@/lib/auth/company-context';
import { passesAudience, type QrAudience } from '@/lib/qr/audience';
import {
  DOCUMENT_TYPE_ACCENT,
  DOCUMENT_TYPE_LABEL,
  type DocumentType,
  type SopTemplate,
  type WorkerLanguage,
} from '@/lib/types/sop';
import { TemplateRenderer } from '@/components/sop/TemplateRenderer';
import type { HrContact } from '@/components/sop/OnboardingRenderer';
import { LanguageToggle } from '@/components/app/LanguageToggle';
import { VideoButtonClient } from './_components/VideoButtonClient';
import { MediaScrollButton } from './_components/MediaScrollButton';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ preview?: string; lang?: string }>;
}

export const metadata = {
  // Worker reader pages are always behind auth — keep them out of search.
  robots: 'noindex',
};

export default async function WorkerSopPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const isPreview = sp.preview === '1';

  let ctx;
  try {
    ctx = await getCompanyContext();
  } catch (e) {
    if (e instanceof AuthError && e.code === 'UNAUTHENTICATED') {
      redirect(`/sign-in?redirect_url=${encodeURIComponent(`/app/sop/${id}`)}`);
    }
    throw e;
  }
  const { userId, supabase, company_id, role } = ctx;

  // Worker preference. Defaults to 'en'. Override via ?lang=es for the
  // current render only; the toggle action persists across page loads.
  const { data: member } = await supabase
    .from('company_members')
    .select('preferred_language')
    .eq('clerk_user_id', userId)
    .eq('company_id', company_id)
    .maybeSingle();

  const persisted: WorkerLanguage = (member?.preferred_language === 'es' ? 'es' : 'en');
  const lang: WorkerLanguage = sp.lang === 'es' ? 'es' : sp.lang === 'en' ? 'en' : persisted;

  const { data: sop } = await supabase
    .from('sops')
    .select('id, title, status, template, template_recommendation')
    .eq('id', id)
    .maybeSingle();
  if (!sop) notFound();

  const sopTemplate: SopTemplate | null =
    ((sop as { template?: SopTemplate | null }).template) ??
    ((sop as { template_recommendation?: { recommended?: SopTemplate } | null }).template_recommendation?.recommended) ??
    null;

  // document_type lives behind migration 20260518000001. Read defensively
  // so a pre-migration row never blocks the worker view; the chip just
  // shows "Procedure" / "Procedimiento" as the safe fallback.
  let documentType: DocumentType = 'sop';
  try {
    const { data: dtRow } = await supabase
      .from('sops')
      .select('document_type')
      .eq('id', id)
      .maybeSingle();
    const raw = (dtRow as { document_type?: DocumentType | null } | null)?.document_type;
    if (raw) documentType = raw;
  } catch {
    // migration not yet applied — fall through with the 'sop' default
  }

  // Archived SOPs are never shown to workers.
  if (sop.status === 'archived') {
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-3 px-6 py-10 text-center" lang={lang}>
        <h1 className="text-2xl font-semibold text-dc-text">No longer available</h1>
        <p className="text-base text-dc-text-2">
          This procedure has been archived. Ask your manager for the current version.
        </p>
      </main>
    );
  }

  // Audience gate. Audience columns live behind migration
  // 20260427000002 — read them in a separate try/catch so a missing
  // column never blocks worker access. If the read fails, we fall
  // through to "no audience set" which `passesAudience` treats as
  // "everyone in the company" — the safe legacy behaviour.
  let audience: QrAudience = { department_ids: [], roles: [] };
  try {
    const { data: audienceRow, error: audienceErr } = await supabase
      .from('sops')
      .select('audience_department_ids, audience_roles')
      .eq('id', id)
      .maybeSingle();
    if (audienceErr) {
      console.warn('[worker sop] audience read failed', { id, code: audienceErr.code, message: audienceErr.message });
    } else if (audienceRow) {
      audience = {
        department_ids: ((audienceRow as { audience_department_ids?: string[] | null }).audience_department_ids ?? []) as string[],
        roles: ((audienceRow as { audience_roles?: Role[] | null }).audience_roles ?? []) as Role[],
      };
    }
  } catch (err) {
    console.warn('[worker sop] audience read threw', { id, message: err instanceof Error ? err.message : String(err) });
  }

  // video_url lives behind migration 20260429000003 — read defensively so a
  // missing column never blocks workers from loading their SOP.
  let sopVideoUrl: string | null = null;
  try {
    const { data: videoRow } = await supabase
      .from('sops')
      .select('video_url')
      .eq('id', id)
      .maybeSingle();
    sopVideoUrl = (videoRow as { video_url?: string | null } | null)?.video_url ?? null;
  } catch {
    // migration not yet applied — no video button shown
  }

  // sop_images lives behind migration 20260511000001 — read defensively.
  interface SopImageWorkerRow {
    id: string;
    storage_path: string;
    caption_en: string | null;
    caption_es: string | null;
    sort_order: number;
  }
  let sopImages: SopImageWorkerRow[] = [];
  const supabasePublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  try {
    const { data: imgRows } = await supabase
      .from('sop_images')
      .select('id, storage_path, caption_en, caption_es, sort_order')
      .eq('sop_id', id)
      .order('sort_order', { ascending: true });
    sopImages = (imgRows ?? []) as SopImageWorkerRow[];
  } catch {
    // migration not yet applied — no media gallery shown
  }

  const { data: memberRow } = await supabase
    .from('company_members')
    .select('id')
    .eq('clerk_user_id', userId)
    .eq('company_id', company_id)
    .maybeSingle();
  const { data: deptRows = [] } = memberRow
    ? await supabase
        .from('employee_departments')
        .select('department_id')
        .eq('member_id', memberRow.id)
    : { data: [] as { department_id: string }[] };

  const scanner = {
    role,
    department_ids: ((deptRows ?? []) as { department_id: string }[]).map((r) => r.department_id),
  };

  if (!passesAudience(audience, scanner)) {
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-3 px-6 py-10 text-center" lang={lang}>
        <h1 className="text-2xl font-semibold text-dc-text">Not for your team</h1>
        <p className="text-base text-dc-text-2">
          This procedure isn&apos;t set up for your department or role. If you think you should
          have access, ask your manager.
        </p>
      </main>
    );
  }

  // Pick latest published version when one exists; otherwise (preview /
  // pending_approval) fall back to the latest version row so managers can
  // verify content before publishing.
  const { data: published } = await supabase
    .from('sop_versions')
    .select('id, content_en, content_es, version_number')
    .eq('sop_id', id)
    .not('published_at', 'is', null)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: latest } = await supabase
    .from('sop_versions')
    .select('id, content_en, content_es, version_number')
    .eq('sop_id', id)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const version = published ?? (isPreview ? latest : null);

  if (!version || (!version.content_en && !version.content_es)) {
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-3 px-6 py-10 text-center" lang={lang}>
        <h1 className="text-2xl font-semibold text-dc-text">Not ready yet</h1>
        <p className="text-base text-dc-text-2">
          This procedure isn&apos;t live. Check back soon.
        </p>
      </main>
    );
  }

  const content = lang === 'es' ? (version.content_es ?? version.content_en ?? '') : (version.content_en ?? '');

  // Fetch HR contacts only for onboarding SOPs. Defensive try/catch so a
  // missing table (migration not yet applied) never blocks the page load.
  let hrContacts: HrContact[] = [];
  if (sopTemplate === 'onboarding') {
    try {
      const { data: contactRows } = await supabase
        .from('hr_contacts')
        .select('id, name, title, category, email, phone, is_primary')
        .eq('company_id', company_id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      hrContacts = (contactRows ?? []) as HrContact[];
    } catch {
      // migration not yet applied — render without contact cards
    }
  }

  const typeAccent = DOCUMENT_TYPE_ACCENT[documentType];

  return (
    <main className="mx-auto min-h-[100dvh] max-w-2xl px-5 py-6 sm:px-6 sm:py-10" lang={lang}>
      <header className="mb-5 flex items-start justify-between gap-3 animate-fade-in">
        <div className="min-w-0 flex gap-3">
          <span
            aria-hidden
            className="mt-1 w-[3px] shrink-0 rounded-full self-stretch"
            style={{ backgroundColor: `var(${typeAccent.var})` }}
          />
          <div className="min-w-0">
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider font-display"
              style={{
                backgroundColor: `color-mix(in srgb, var(${typeAccent.var}) 12%, transparent)`,
                color: `var(${typeAccent.var})`,
              }}
            >
              {DOCUMENT_TYPE_LABEL[documentType][lang]}
            </span>
            <h1 className="mt-1.5 font-display text-2xl leading-tight font-bold text-dc-text">
              {sop.title}
            </h1>
          </div>
        </div>
        <LanguageToggle current={lang} />
      </header>

      {(sopVideoUrl || sopImages.length > 0) && (
        <div
          className="mb-5 flex flex-col gap-2 animate-fade-in"
          style={{ animationDelay: "60ms", animationFillMode: "backwards" }}
        >
          {sopVideoUrl && (
            <VideoButtonClient videoUrl={sopVideoUrl} sopTitle={sop.title} lang={lang} />
          )}
          {sopImages.length > 0 && (
            <MediaScrollButton lang={lang} />
          )}
        </div>
      )}

      <article
        className="text-[17px] leading-relaxed animate-fade-in"
        style={{ animationDelay: "120ms", animationFillMode: "backwards" }}
      >
        <TemplateRenderer content={content} template={sopTemplate} lang={lang} hrContacts={hrContacts} />
      </article>

      {sopImages.length > 0 && (
        <section
          id="sop-media"
          aria-label={lang === 'es' ? 'Medios' : 'Media'}
          className="mt-8 border-t border-[color:var(--dc-edge)] pt-6"
        >
          <h2 className="mb-4 text-lg font-semibold text-dc-text">
            {lang === 'es' ? 'Medios' : 'Media'}
          </h2>
          <div className="flex flex-col gap-6">
            {sopImages.map((img) => {
              const caption = lang === 'es' ? (img.caption_es ?? img.caption_en) : img.caption_en;
              const publicUrl = `${supabasePublicUrl}/storage/v1/object/public/sop-images/${img.storage_path}`;
              return (
                <figure key={img.id} className="flex flex-col gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={publicUrl}
                    alt={caption ?? ''}
                    className="w-full rounded-lg object-contain"
                    loading="lazy"
                  />
                  {caption && (
                    <figcaption className="text-sm text-dc-text-2">{caption}</figcaption>
                  )}
                </figure>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
