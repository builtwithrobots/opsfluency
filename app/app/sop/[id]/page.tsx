import { notFound, redirect } from 'next/navigation';

import { AuthError, getCompanyContext, type Role } from '@/lib/auth/company-context';
import { passesAudience, type QrAudience } from '@/lib/qr/audience';
import { renderMarkdown } from '@/lib/sop/markdown';
import type { WorkerLanguage } from '@/lib/types/sop';
import { LanguageToggleClient } from './_components/LanguageToggleClient';
import { VideoButtonClient } from './_components/VideoButtonClient';

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
    .select('id, title, status')
    .eq('id', id)
    .maybeSingle();
  if (!sop) notFound();

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

  return (
    <main className="mx-auto min-h-[100dvh] max-w-2xl px-5 py-6 sm:px-6 sm:py-10" lang={lang}>
      <header className="mb-5 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl leading-tight font-bold text-dc-text">
          {sop.title}
        </h1>
        <LanguageToggleClient sopId={id} current={lang} />
      </header>

      {sopVideoUrl && (
        <div className="mb-5">
          <VideoButtonClient videoUrl={sopVideoUrl} sopTitle={sop.title} lang={lang} />
        </div>
      )}

      <article className="text-[17px] leading-relaxed">
        {renderMarkdown(content)}
      </article>
    </main>
  );
}
