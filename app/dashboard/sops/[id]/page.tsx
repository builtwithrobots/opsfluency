import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';

import { AuthError, getCompanyContext } from '@/lib/auth/company-context';
import { isCurrentUserSuperAdmin } from '@/lib/auth/super-admin-context';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardTabs, type TabDef } from '@/components/dashboard/dashboard-tabs';
import { renderMarkdown } from '@/lib/sop/markdown';
import { type FlaggedTerm } from '@/lib/ai/sop-conversion';
import { type SopStatus, SOP_UPLOADS_BUCKET } from '@/lib/types/sop';
import type { PrintConfig, QrTargetType } from '@/lib/qr/print-config';
import QRPrintEditor from '@/components/qr/QRPrintEditor';

// Pinned high so the Sonnet conversion call (default 180s timeout) doesn't get
// killed by Vercel mid-flight. Server Actions inherit the route's maxDuration.
// Hobby caps at 60s — bump your Vercel plan or this is a no-op.
export const maxDuration = 300;

import { StageRail } from './_components/StageRail';
import { ActionBanner } from './_components/ActionBanner';
import { OriginalEmbed } from './_components/OriginalEmbed';
import { SpanishEditorClient } from './_components/SpanishEditorClient';
import { UploadNewVersionClient } from './_components/UploadNewVersionClient';
import { ArchiveButton } from './_components/ArchiveButton';
import { PhoneFrame } from './_components/PhoneFrame';
import { SuperAdminDangerZone } from './_components/SuperAdminDangerZone';
import { AudienceClient } from './_components/AudienceClient';
import { VideoClient } from './_components/VideoClient';
import { getCreatorScope } from '@/lib/qr/creator-scope';
import type { Role } from '@/lib/auth/company-context';

const VALID_TABS = ['original', 'english', 'spanish', 'app', 'audience', 'video', 'versions', 'qr'] as const;
type Tab = (typeof VALID_TABS)[number];

const STATUS_BADGE: Record<SopStatus, { label: string; color: Parameters<typeof Badge>[0]['color'] }> = {
  draft:                { label: 'Draft',                 color: 'zinc' },
  pending_terms:        { label: 'Pending Terms',          color: 'signal-warn' },
  pending_translation:  { label: 'Pending Translation',    color: 'signal-info' },
  pending_approval:     { label: 'Pending Approval',       color: 'signal-hub' },
  published:            { label: 'Published',              color: 'signal-ok' },
  archived:             { label: 'Archived',               color: 'signal-neutral' },
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

interface VersionRow {
  id: string;
  version_number: number;
  content_en: string | null;
  content_es: string | null;
  flagged_terms: FlaggedTerm[] | null;
  needs_retranslation: boolean;
  original_file_url: string | null;
  published_at: string | null;
  created_at: string;
}

export default async function SopDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const tab: Tab = (VALID_TABS as readonly string[]).includes(sp.tab ?? '') ? (sp.tab as Tab) : 'original';

  let ctx;
  try {
    ctx = await getCompanyContext('manager');
  } catch (e) {
    if (e instanceof AuthError) {
      if (e.code === 'UNAUTHENTICATED') redirect('/sign-in');
      if (e.code === 'NO_COMPANY' && (await isCurrentUserSuperAdmin())) {
        redirect('/dashboard/platform');
      }
    }
    throw e;
  }
  const { userId, supabase, company_id, role, impersonating } = ctx;
  const viewerIsSuperAdmin = await isCurrentUserSuperAdmin();

  const { data: sop, error: sopErr } = await supabase
    .from('sops')
    .select('id, title, status, department_id, created_at, updated_at, archived_at, departments(id, name)')
    .eq('id', id)
    .eq('company_id', company_id)
    .maybeSingle();
  if (sopErr || !sop) notFound();

  // Audience columns live behind migration 20260427000002. Read them in a
  // separate try/catch so a missing-column or transient PostgREST error
  // never takes down the whole detail page — the manager can still see
  // their SOP, edit content, and run translation; they just can't open
  // the Audience tab until the migration lands. Fall back to empty
  // (= "everyone in the company"), which is the safest legacy behaviour.
  let sopAudience: { department_ids: string[]; roles: Role[] } = {
    department_ids: [],
    roles: [],
  };
  try {
    const { data: audienceRow, error: audienceErr } = await supabase
      .from('sops')
      .select('audience_department_ids, audience_roles')
      .eq('id', id)
      .eq('company_id', company_id)
      .maybeSingle();
    if (audienceErr) {
      console.warn('[sop detail] audience read failed', { id, code: audienceErr.code, message: audienceErr.message });
    } else if (audienceRow) {
      sopAudience = {
        department_ids: ((audienceRow as { audience_department_ids?: string[] | null }).audience_department_ids ?? []) as string[],
        roles: ((audienceRow as { audience_roles?: Role[] | null }).audience_roles ?? []) as Role[],
      };
    }
  } catch (err) {
    console.warn('[sop detail] audience read threw', { id, message: err instanceof Error ? err.message : String(err) });
  }

  const status = sop.status as SopStatus;
  const deptRaw = sop.departments as unknown as { id: string; name: string } | { id: string; name: string }[] | null;
  const dept = Array.isArray(deptRaw) ? (deptRaw[0] ?? null) : deptRaw;

  const { data: versions = [] } = await supabase
    .from('sop_versions')
    .select('id, version_number, content_en, content_es, flagged_terms, needs_retranslation, original_file_url, published_at, created_at')
    .eq('sop_id', id)
    .order('version_number', { ascending: false });

  const versionRows = (versions ?? []) as unknown as VersionRow[];
  const latest = versionRows[0] ?? null;

  // QR (only created on first publish — may not exist yet)
  const { data: qrRow } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('company_id', company_id)
    .eq('target_type', 'sop')
    .eq('target_id', id)
    .maybeSingle();

  const { data: company } = await supabase
    .from('companies')
    .select('name, phone, logo_url')
    .eq('id', company_id)
    .single();

  // Active glossary — only needed during pending_terms so the conflict
  // panel in TermsGateClient can flag terms that already exist before
  // the manager hits Save (and we 23505 on the unique index).
  let existingGlossary: { id: string; term_en: string; definition_en: string | null; term_es: string; definition_es: string | null }[] = [];
  if (status === 'pending_terms') {
    const { data: rows } = await supabase
      .from('glossary_terms')
      .select('id, term_en, definition_en, term_es, definition_es')
      .eq('company_id', company_id)
      .is('deleted_at', null);
    existingGlossary = rows ?? [];
  }

  // Audience tab data — only fetched when the manager is on that tab so we
  // don't pull every department on every viewer load.
  let allDepartments: { id: string; name: string }[] = [];
  let creatorScope: Awaited<ReturnType<typeof getCreatorScope>> | null = null;
  if (tab === 'audience') {
    const [{ data: deptRows = [] }, scope] = await Promise.all([
      supabase.from('departments').select('id, name').eq('company_id', company_id).order('name'),
      getCreatorScope({ supabase, userId, company_id, role, impersonating }),
    ]);
    allDepartments = deptRows ?? [];
    creatorScope = scope;
  }

  // Disable App view until conversion has produced something for the worker
  // page to render — otherwise the iframe would show the "Not ready yet"
  // empty state, which is correct but not useful.
  const hasWorkerContent = !!latest?.content_en;

  // video_url lives behind migration 20260429000003. Read defensively so a
  // missing column never breaks the SOP detail page before migration lands.
  let sopVideoUrl: string | null = null;
  try {
    const { data: videoRow } = await supabase
      .from('sops')
      .select('video_url')
      .eq('id', id)
      .eq('company_id', company_id)
      .maybeSingle();
    sopVideoUrl = (videoRow as { video_url?: string | null } | null)?.video_url ?? null;
  } catch (err) {
    console.warn('[sop detail] video_url read failed', { id, message: err instanceof Error ? err.message : String(err) });
  }

  const tabs: TabDef[] = [
    { id: 'original', label: 'Original',   href: `/dashboard/sops/${id}?tab=original` },
    { id: 'english',  label: 'English',    href: `/dashboard/sops/${id}?tab=english` },
    { id: 'spanish',  label: 'Spanish',    href: `/dashboard/sops/${id}?tab=spanish`, disabled: !latest?.content_es },
    { id: 'app',      label: 'App view',   href: `/dashboard/sops/${id}?tab=app`, disabled: !hasWorkerContent },
    { id: 'audience', label: 'Audience',   href: `/dashboard/sops/${id}?tab=audience` },
    { id: 'video',    label: 'Video',      href: `/dashboard/sops/${id}?tab=video` },
    { id: 'versions', label: 'Versions',   href: `/dashboard/sops/${id}?tab=versions` },
    { id: 'qr',       label: 'QR',         href: `/dashboard/sops/${id}?tab=qr`, disabled: !qrRow },
  ];

  const badge = STATUS_BADGE[status];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-4">
        <Button href="/dashboard/sops" plain className="-ml-2 self-start">
          <ArrowLeft data-slot="icon" strokeWidth={2} />
          Back to SOPs
        </Button>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <Heading className="truncate">{sop.title}</Heading>
            <Text className="mt-1 flex items-center gap-2 text-xs">
              {dept ? <span>{dept.name}</span> : <span className="text-dc-text-3">No department</span>}
              <span className="text-dc-text-3">·</span>
              <span className="text-dc-text-3">Updated {new Date(sop.updated_at).toLocaleDateString()}</span>
            </Text>
          </div>
          <div className="flex items-center gap-3">
            <Badge color={badge.color}>{badge.label}</Badge>
            {status === 'published' && (
              <ArchiveButton sopId={id} />
            )}
          </div>
        </div>
      </header>

      {/* Stage rail */}
      <StageRail status={status} />

      {/* Status-driven action banner / gate */}
      <ActionBanner
        sopId={id}
        status={status}
        latestVersion={latest}
        qrCodeId={qrRow?.id ?? null}
        existingGlossary={existingGlossary}
      />

      {/* Tabs */}
      <DashboardTabs tabs={tabs} activeTab={tab} />

      {/* Tab content */}
      {tab === 'original' && latest?.original_file_url && (
        <OriginalEmbed
          path={latest.original_file_url}
          bucket={SOP_UPLOADS_BUCKET}
        />
      )}
      {tab === 'original' && !latest?.original_file_url && (
        <EmptyTab message="No original file is attached to this SOP." />
      )}

      {tab === 'english' && latest?.content_en && (
        <article className="rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-6">
          {renderMarkdown(latest.content_en, { className: 'max-w-none' })}
        </article>
      )}
      {tab === 'english' && !latest?.content_en && (
        <EmptyTab message="English Markdown will appear here once Sonnet conversion runs." />
      )}

      {tab === 'spanish' && latest?.content_es && (
        <SpanishEditorClient
          sopId={id}
          initialContent={latest.content_es}
          needsRetranslation={latest.needs_retranslation}
        />
      )}
      {tab === 'spanish' && !latest?.content_es && (
        <EmptyTab message="Spanish translation hasn't run yet." />
      )}

      {tab === 'app' && hasWorkerContent && (
        <div className="flex flex-col items-start gap-6 rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-6 lg:flex-row">
          <PhoneFrame
            src={`/app/sop/${id}?preview=1`}
            title="Worker reader preview"
            caption="Live preview · 390 × 844 (iPhone 12+ viewport)"
          />
          <div className="flex-1 text-sm text-dc-text-2">
            <p className="font-semibold text-dc-text">What workers see</p>
            <p className="mt-2">
              This is a real render of <code className="rounded bg-dc-raised px-1.5 py-0.5 text-xs">/app/sop/{id}</code>{' '}
              — the same page that loads when an employee scans the QR. The EN/ES toggle inside
              the frame works; preferences persist back to{' '}
              <code className="rounded bg-dc-raised px-1.5 py-0.5 text-xs">company_members.preferred_language</code>.
            </p>
            <p className="mt-3 text-xs text-dc-text-3">
              Preview mode shows the latest version even if it&apos;s not yet published, so you
              can spot-check before approval. Workers always see the latest <em>published</em>{' '}
              version only.
            </p>
          </div>
        </div>
      )}
      {tab === 'app' && !hasWorkerContent && (
        <EmptyTab message="The worker preview will appear here once Sonnet conversion runs." />
      )}

      {tab === 'audience' && creatorScope && (
        <AudienceClient
          sopId={id}
          departments={allDepartments}
          scope={creatorScope}
          initial={sopAudience}
        />
      )}

      {tab === 'video' && (
        <VideoClient sopId={id} initialVideoUrl={sopVideoUrl} />
      )}

      {tab === 'versions' && (
        <VersionsList
          sopId={id}
          versions={versionRows}
        />
      )}

      {tab === 'qr' && qrRow && (
        <div className="rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-6">
          <div className="mb-4 flex items-center gap-2 text-sm text-dc-text-3">
            <span>Scan URL:</span>
            <a
              href={`/s/${qrRow.id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-mono text-(--color-brand) hover:underline"
            >
              /s/{qrRow.id}
              <ExternalLink className="size-3" />
            </a>
          </div>
          <QRPrintEditor
            qrCodeId={qrRow.id}
            targetType={qrRow.target_type as QrTargetType}
            initialConfig={qrRow.print_config as Partial<PrintConfig>}
            initialLabel={qrRow.label}
            companyName={company?.name}
            logoUrl={company?.logo_url}
            companyPhone={company?.phone}
          />
        </div>
      )}
      {tab === 'qr' && !qrRow && (
        <EmptyTab message="A QR code is generated automatically when this SOP is published." />
      )}

      {viewerIsSuperAdmin && (
        <SuperAdminDangerZone
          sopId={id}
          sopTitle={sop.title}
          versionCount={versionRows.length}
          hasQrCode={!!qrRow}
        />
      )}
    </div>
  );
}

function EmptyTab({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface px-6 py-10 text-center text-sm text-dc-text-3">
      {message}
    </div>
  );
}

interface VersionsListProps {
  sopId: string;
  versions: VersionRow[];
}

function VersionsList({ sopId, versions }: VersionsListProps) {
  return (
    <div className="flex flex-col gap-4">
      <UploadNewVersionClient sopId={sopId} />

      {versions.length === 0 ? (
        <EmptyTab message="No versions yet." />
      ) : (
        <ul className="flex flex-col gap-2">
          {versions.map((v) => (
            <li
              key={v.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface px-5 py-4"
            >
              <span className="rounded-md bg-dc-raised px-2 py-1 font-mono text-xs text-dc-text-2">
                v{v.version_number}
              </span>
              <span className="flex-1 truncate text-sm text-dc-text">
                {v.original_file_url ? v.original_file_url.split('/').pop() : '(no file)'}
              </span>
              <span className="text-xs text-dc-text-3">
                {new Date(v.created_at).toLocaleString()}
              </span>
              {v.published_at && <Badge color="signal-ok">Published</Badge>}
              {v.needs_retranslation && <Badge color="signal-warn">Needs re-translation</Badge>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
