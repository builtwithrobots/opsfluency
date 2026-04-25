import { notFound, redirect } from 'next/navigation';

import { AuthError, getCompanyContext } from '@/lib/auth/company-context';
import { renderMarkdown } from '@/lib/sop/markdown';
import type { WorkerLanguage } from '@/lib/types/sop';
import { LanguageToggleClient } from './_components/LanguageToggleClient';

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
  const { userId, supabase, company_id } = ctx;

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

      <article className="text-[17px] leading-relaxed">
        {renderMarkdown(content)}
      </article>
    </main>
  );
}
