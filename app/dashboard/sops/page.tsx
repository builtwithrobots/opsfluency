import {
  AlertCircle,
  Archive,
  BookOpen,
  CheckSquare,
  ChevronDown,
  Clock,
  FileText,
  Hammer,
  Hash,
  List,
  Palette,
  Search,
  Users,
} from 'lucide-react';
import { redirect } from 'next/navigation';

import { AuthError, getCompanyContext } from '@/lib/auth/company-context';
import { isCurrentUserSuperAdmin } from '@/lib/auth/super-admin-context';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardTabs, type TabDef } from '@/components/dashboard/dashboard-tabs';
import { SOP_TEMPLATE, type SopStatus, type SopTemplate } from '@/lib/types/sop';
import { CreateSopClient } from './_components/CreateSopClient';
import { SopTemplateTabClient } from './_components/SopTemplateTabClient';

// ── Constants ────────────────────────────────────────────────────────────────

const VALID_TABS = ['library', 'build', 'archive', 'template'] as const;
type Tab = (typeof VALID_TABS)[number];

const TEMPLATE_LABELS: Record<SopTemplate, string> = {
  'step-by-step': 'Step-by-Step',
  'reference': 'Reference',
  'safety-checklist': 'Safety Checklist',
  'onboarding': 'Onboarding',
};

const TEMPLATE_ICONS: Record<SopTemplate, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  'step-by-step': List,
  'reference': FileText,
  'safety-checklist': CheckSquare,
  'onboarding': Users,
};

const STATUS_BADGE: Record<SopStatus, { label: string; color: string }> = {
  draft:                { label: 'Draft',               color: 'zinc' },
  pending_terms:        { label: 'Pending Terms',        color: 'signal-warn' },
  pending_translation:  { label: 'Pending Translation',  color: 'signal-info' },
  pending_approval:     { label: 'Pending Approval',     color: 'signal-hub' },
  published:            { label: 'Published',            color: 'signal-ok' },
  archived:             { label: 'Archived',             color: 'signal-neutral' },
};

const PIPELINE_STAGES: { status: SopStatus; label: string; step: number }[] = [
  { status: 'draft',               label: 'Draft',               step: 1 },
  { status: 'pending_terms',       label: 'Pending Terms',       step: 2 },
  { status: 'pending_translation', label: 'Pending Translation', step: 3 },
  { status: 'pending_approval',    label: 'Pending Approval',    step: 4 },
];

// ── Row types (from Supabase queries) ────────────────────────────────────────

interface SopRow {
  id: string;
  title: string;
  status: SopStatus;
  template: SopTemplate;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  departments: { id: string; name: string } | null;
}

interface Department {
  id: string;
  name: string;
}

// ── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{
    tab?: string;
    q?: string;
    dept?: string;
    sort?: string;
    dir?: string;
  }>;
}

export default async function SopsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const rawTab = params.tab;
  const tab: Tab = VALID_TABS.includes(rawTab as Tab) ? (rawTab as Tab) : 'library';
  const q = params.q ?? '';
  const deptFilter = params.dept ?? '';
  const sort = (params.sort ?? 'date') as 'title' | 'dept' | 'date';
  const dir = (params.dir ?? 'desc') as 'asc' | 'desc';

  let ctx;
  try {
    ctx = await getCompanyContext('manager');
  } catch (e) {
    if (e instanceof AuthError) {
      if (e.code === 'NO_COMPANY' && (await isCurrentUserSuperAdmin())) {
        redirect('/dashboard/platform');
      }
      if (e.code === 'UNAUTHENTICATED') redirect('/sign-in');
    }
    throw e;
  }
  const { supabase, company_id, role } = ctx;
  const isAdmin = role === 'admin';

  // ── Tabs ──────────────────────────────────────────────────────────────────

  const tabs: TabDef[] = [
    { id: 'library',  label: 'Library',  href: '/dashboard/sops?tab=library' },
    { id: 'build',    label: 'Build',    href: '/dashboard/sops?tab=build' },
    { id: 'archive',  label: 'Archive',  href: '/dashboard/sops?tab=archive' },
    { id: 'template', label: 'Template', href: '/dashboard/sops?tab=template' },
  ];

  // ── Shared: departments for filters + create form ────────────────────────

  const { data: departments = [] } = await supabase
    .from('departments')
    .select('id, name')
    .eq('company_id', company_id)
    .order('name');

  // ── Shared: company template settings ────────────────────────────────────

  const { data: company } = await supabase
    .from('companies')
    .select('default_sop_template, sop_template_locked')
    .eq('id', company_id)
    .single();

  const defaultTemplate: SopTemplate = (company?.default_sop_template as SopTemplate) ?? 'step-by-step';
  const templateLocked: boolean = company?.sop_template_locked ?? false;

  // ── Library tab data ──────────────────────────────────────────────────────

  let librarySops: SopRow[] = [];
  let libraryError: string | null = null;

  if (tab === 'library') {
    try {
      let query = supabase
        .from('sops')
        .select('id, title, status, template, created_at, updated_at, archived_at, departments(id, name)')
        .eq('company_id', company_id)
        .eq('status', 'published');

      if (deptFilter) query = query.eq('department_id', deptFilter);
      if (q) query = query.ilike('title', `%${q}%`);

      if (sort === 'title') {
        query = query.order('title', { ascending: dir === 'asc' });
      } else if (sort === 'dept') {
        query = query.order('department_id', { ascending: dir === 'asc', nullsFirst: false });
      } else {
        query = query.order('updated_at', { ascending: dir === 'asc' });
      }

      const { data, error } = await query;
      if (error) libraryError = error.message;
      else librarySops = (data ?? []) as unknown as SopRow[];
    } catch {
      libraryError = 'Unable to load SOPs.';
    }
  }

  // ── Build tab data ────────────────────────────────────────────────────────

  let buildSops: SopRow[] = [];
  let buildError: string | null = null;

  if (tab === 'build') {
    try {
      const { data, error } = await supabase
        .from('sops')
        .select('id, title, status, template, created_at, updated_at, archived_at, departments(id, name)')
        .eq('company_id', company_id)
        .in('status', ['draft', 'pending_terms', 'pending_translation', 'pending_approval'])
        .order('updated_at', { ascending: false });

      if (error) buildError = error.message;
      else buildSops = (data ?? []) as unknown as SopRow[];
    } catch {
      buildError = 'Unable to load in-progress SOPs.';
    }
  }

  // ── Archive tab data ──────────────────────────────────────────────────────

  let archiveSops: SopRow[] = [];
  let archiveError: string | null = null;

  if (tab === 'archive') {
    try {
      let query = supabase
        .from('sops')
        .select('id, title, status, template, created_at, updated_at, archived_at, departments(id, name)')
        .eq('company_id', company_id)
        .eq('status', 'archived');

      if (deptFilter) query = query.eq('department_id', deptFilter);
      if (q) query = query.ilike('title', `%${q}%`);

      if (sort === 'title') {
        query = query.order('title', { ascending: dir === 'asc' });
      } else if (sort === 'dept') {
        query = query.order('department_id', { ascending: dir === 'asc', nullsFirst: false });
      } else {
        query = query.order('archived_at', { ascending: dir === 'asc', nullsFirst: false });
      }

      const { data, error } = await query;
      if (error) archiveError = error.message;
      else archiveSops = (data ?? []) as unknown as SopRow[];
    } catch {
      archiveError = 'Unable to load archived SOPs.';
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.15em] text-(--color-brand) uppercase">
            SOPs
          </p>
          <Heading className="font-display mt-2">Standard Operating Procedures</Heading>
          <Text className="mt-2 max-w-2xl">
            Build, publish, and manage bilingual SOPs. Set your org template, track the pipeline,
            and keep the archive for compliance.
          </Text>
        </div>
        {tab === 'build' && (
          <CreateSopClient
            departments={(departments ?? []) as Department[]}
            defaultTemplate={defaultTemplate}
            templateLocked={templateLocked}
          />
        )}
        {tab === 'library' && (
          <Button href="/dashboard/sops?tab=build" color="brand">
            <Hammer data-slot="icon" strokeWidth={2} />
            Build SOP
          </Button>
        )}
      </header>

      {/* Tab bar */}
      <DashboardTabs tabs={tabs} activeTab={tab} />

      {/* Tab panels */}
      {tab === 'library' && (
        <LibraryTab
          sops={librarySops}
          fetchError={libraryError}
          departments={(departments ?? []) as Department[]}
          q={q}
          deptFilter={deptFilter}
          sort={sort}
          dir={dir}
        />
      )}

      {tab === 'build' && (
        <BuildTab
          sops={buildSops}
          fetchError={buildError}
          defaultTemplate={defaultTemplate}
          templateLocked={templateLocked}
        />
      )}

      {tab === 'archive' && (
        <ArchiveTab
          sops={archiveSops}
          fetchError={archiveError}
          departments={(departments ?? []) as Department[]}
          q={q}
          deptFilter={deptFilter}
          sort={sort}
          dir={dir}
        />
      )}

      {tab === 'template' && (
        <TemplateTab
          currentTemplate={company?.default_sop_template as SopTemplate | null ?? null}
          templateLocked={templateLocked}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}

// ── Library tab ───────────────────────────────────────────────────────────────

interface LibraryTabProps {
  sops: SopRow[];
  fetchError: string | null;
  departments: Department[];
  q: string;
  deptFilter: string;
  sort: 'title' | 'dept' | 'date';
  dir: 'asc' | 'desc';
}

function LibraryTab({ sops, fetchError, departments, q, deptFilter, sort, dir }: LibraryTabProps) {
  if (fetchError) return <FetchError message={fetchError} />;

  const deptName = departments.find((d) => d.id === deptFilter)?.name;

  return (
    <div className="flex flex-col gap-5">
      {/* Filters */}
      <form
        action="/dashboard/sops"
        method="GET"
        className="flex flex-wrap items-center gap-2"
      >
        <input type="hidden" name="tab" value="library" />

        {/* Search */}
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dc-text-3"
          />
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search by title…"
            className="w-full rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised py-2 pl-9 pr-3 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
          />
        </div>

        {/* Department filter */}
        <div className="relative">
          <select
            name="dept"
            defaultValue={deptFilter}
            className="appearance-none rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised py-2 pl-3 pr-8 text-sm text-dc-text focus:border-(--color-brand) focus:outline-none"
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <ChevronDown aria-hidden className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-dc-text-3" />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            name="sort"
            defaultValue={sort}
            className="appearance-none rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised py-2 pl-3 pr-8 text-sm text-dc-text focus:border-(--color-brand) focus:outline-none"
          >
            <option value="date">Sort: Last updated</option>
            <option value="title">Sort: Title</option>
            <option value="dept">Sort: Department</option>
          </select>
          <ChevronDown aria-hidden className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-dc-text-3" />
        </div>

        {/* Direction */}
        <div className="relative">
          <select
            name="dir"
            defaultValue={dir}
            className="appearance-none rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised py-2 pl-3 pr-8 text-sm text-dc-text focus:border-(--color-brand) focus:outline-none"
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
          <ChevronDown aria-hidden className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-dc-text-3" />
        </div>

        <Button type="submit" plain>Apply</Button>
        {(q || deptFilter) && (
          <Button href="/dashboard/sops?tab=library" plain>Clear</Button>
        )}
      </form>

      {/* Results summary */}
      {sops.length > 0 && (
        <p className="text-xs text-dc-text-3">
          {sops.length} published {sops.length === 1 ? 'SOP' : 'SOPs'}
          {q ? ` matching "${q}"` : ''}
          {deptName ? ` in ${deptName}` : ''}
        </p>
      )}

      {/* Cards */}
      {!sops.length ? (
        q || deptFilter ? (
          <div className="py-12 text-center text-sm text-dc-text-3">
            No published SOPs match your filters.
          </div>
        ) : (
          <LibraryEmptyState />
        )
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sops.map((sop, i) => (
            <SopCard key={sop.id} sop={sop} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Build tab ─────────────────────────────────────────────────────────────────

interface BuildTabProps {
  sops: SopRow[];
  fetchError: string | null;
  defaultTemplate: SopTemplate;
  templateLocked: boolean;
}

function BuildTab({ sops, fetchError, defaultTemplate, templateLocked }: BuildTabProps) {
  if (fetchError) return <FetchError message={fetchError} />;

  const TemplateIcon = TEMPLATE_ICONS[defaultTemplate];

  // Group by pipeline stage
  const grouped = PIPELINE_STAGES.map((stage) => ({
    ...stage,
    sops: sops.filter((s) => s.status === stage.status),
  }));

  const totalInPipeline = sops.length;

  return (
    <div className="flex flex-col gap-6">
      {/* Org template context banner */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-(--color-brand)/10 text-(--color-brand)">
            <TemplateIcon className="size-4" strokeWidth={1.5} />
          </span>
          <div>
            <p className="text-sm font-semibold text-dc-text">
              Org template: {TEMPLATE_LABELS[defaultTemplate]}
              {templateLocked && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-(--color-signal-warn)/15 px-1.5 py-0.5 text-xs font-medium text-(--color-signal-warn)">
                  Locked
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-dc-text-3">
              {templateLocked
                ? 'All new SOPs must use this template.'
                : 'New SOPs default to this template. Managers can override.'}
            </p>
          </div>
        </div>
        <Button href="/dashboard/sops?tab=template" plain className="shrink-0 text-sm">
          <Palette data-slot="icon" className="size-4" strokeWidth={1.5} />
          Change
        </Button>
      </div>

      {/* Pipeline overview */}
      {totalInPipeline === 0 ? (
        <BuildEmptyState />
      ) : (
        <div className="flex flex-col gap-6">
          <p className="text-xs text-dc-text-3">
            {totalInPipeline} {totalInPipeline === 1 ? 'SOP' : 'SOPs'} in the pipeline
          </p>

          {grouped.map((stage) => {
            if (stage.sops.length === 0) return null;
            return (
              <div key={stage.status}>
                {/* Stage header */}
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-(--color-brand)/10 text-xs font-bold text-(--color-brand)">
                    {stage.step}
                  </span>
                  <h3 className="text-sm font-semibold text-dc-text">{stage.label}</h3>
                  <span className="rounded-full bg-dc-raised px-2 py-0.5 text-xs text-dc-text-3">
                    {stage.sops.length}
                  </span>
                </div>

                {/* Stage SOPs */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {stage.sops.map((sop, i) => (
                    <BuildSopCard key={sop.id} sop={sop} index={i} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Archive tab ───────────────────────────────────────────────────────────────

interface ArchiveTabProps {
  sops: SopRow[];
  fetchError: string | null;
  departments: Department[];
  q: string;
  deptFilter: string;
  sort: 'title' | 'dept' | 'date';
  dir: 'asc' | 'desc';
}

function ArchiveTab({ sops, fetchError, departments, q, deptFilter, sort, dir }: ArchiveTabProps) {
  if (fetchError) return <FetchError message={fetchError} />;

  const deptName = departments.find((d) => d.id === deptFilter)?.name;

  return (
    <div className="flex flex-col gap-5">
      {/* Filters */}
      <form
        action="/dashboard/sops"
        method="GET"
        className="flex flex-wrap items-center gap-2"
      >
        <input type="hidden" name="tab" value="archive" />

        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dc-text-3"
          />
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search archived SOPs…"
            className="w-full rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised py-2 pl-9 pr-3 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
          />
        </div>

        <div className="relative">
          <select
            name="dept"
            defaultValue={deptFilter}
            className="appearance-none rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised py-2 pl-3 pr-8 text-sm text-dc-text focus:border-(--color-brand) focus:outline-none"
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <ChevronDown aria-hidden className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-dc-text-3" />
        </div>

        <div className="relative">
          <select
            name="sort"
            defaultValue={sort}
            className="appearance-none rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised py-2 pl-3 pr-8 text-sm text-dc-text focus:border-(--color-brand) focus:outline-none"
          >
            <option value="date">Sort: Archived date</option>
            <option value="title">Sort: Title</option>
            <option value="dept">Sort: Department</option>
          </select>
          <ChevronDown aria-hidden className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-dc-text-3" />
        </div>

        <div className="relative">
          <select
            name="dir"
            defaultValue={dir}
            className="appearance-none rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised py-2 pl-3 pr-8 text-sm text-dc-text focus:border-(--color-brand) focus:outline-none"
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
          <ChevronDown aria-hidden className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-dc-text-3" />
        </div>

        <Button type="submit" plain>Apply</Button>
        {(q || deptFilter) && (
          <Button href="/dashboard/sops?tab=archive" plain>Clear</Button>
        )}
      </form>

      {sops.length > 0 && (
        <p className="text-xs text-dc-text-3">
          {sops.length} archived {sops.length === 1 ? 'SOP' : 'SOPs'}
          {q ? ` matching "${q}"` : ''}
          {deptName ? ` in ${deptName}` : ''}
        </p>
      )}

      {!sops.length ? (
        q || deptFilter ? (
          <div className="py-12 text-center text-sm text-dc-text-3">
            No archived SOPs match your filters.
          </div>
        ) : (
          <ArchiveEmptyState />
        )
      ) : (
        <div className="flex flex-col gap-2">
          {sops.map((sop) => (
            <ArchiveSopRow key={sop.id} sop={sop} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Template tab ──────────────────────────────────────────────────────────────

interface TemplateTabProps {
  currentTemplate: SopTemplate | null;
  templateLocked: boolean;
  isAdmin: boolean;
}

function TemplateTab({ currentTemplate, templateLocked, isAdmin }: TemplateTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-6">
        <div className="flex items-start gap-4">
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-(--color-brand)/10 text-(--color-brand)"
          >
            <Palette className="size-5" strokeWidth={1.5} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-dc-text">SOP Template Style</h2>
            <p className="mt-1 max-w-lg text-sm text-dc-text-2">
              Choose the default template all new SOPs will use. Lock it to enforce consistency
              across your team — only admins can unlock it.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <SopTemplateTabClient
            currentTemplate={currentTemplate}
            templateLocked={templateLocked}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </div>
  );
}

// ── Shared cards + rows ───────────────────────────────────────────────────────

function SopCard({ sop, index }: { sop: SopRow; index: number }) {
  const badge = STATUS_BADGE[sop.status];
  const TemplateIcon = TEMPLATE_ICONS[sop.template];

  return (
    <div
      className="group relative flex flex-col gap-4 rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-5 shadow-xs transition-shadow hover:shadow-md"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-(--color-brand)/10 text-(--color-brand)"
        >
          <TemplateIcon className="size-4" strokeWidth={2} />
        </span>
        <Badge color={badge.color as Parameters<typeof Badge>[0]['color']}>{badge.label}</Badge>
      </div>

      {/* Title + dept */}
      <div className="flex-1">
        <p className="font-semibold leading-snug text-dc-text">{sop.title}</p>
        {sop.departments && (
          <p className="mt-1 text-xs text-dc-text-3">{sop.departments.name}</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[color:var(--dc-edge)] pt-3">
        <div className="flex items-center gap-1 text-xs text-dc-text-3">
          <Clock className="size-3.5" />
          {new Date(sop.updated_at).toLocaleDateString()}
        </div>
        <div className="flex items-center gap-1 text-xs text-dc-text-3">
          <Hash className="size-3" />
          {TEMPLATE_LABELS[sop.template]}
        </div>
      </div>

      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 rounded-b-xl bg-(--color-brand) transition-transform duration-200 group-hover:scale-x-100"
      />
    </div>
  );
}

function BuildSopCard({ sop, index }: { sop: SopRow; index: number }) {
  const badge = STATUS_BADGE[sop.status];
  const TemplateIcon = TEMPLATE_ICONS[sop.template];

  const nextActionLabel: Record<SopStatus, string | null> = {
    draft: 'Upload document',
    pending_terms: 'Review terms',
    pending_translation: 'Review translation',
    pending_approval: 'Approve for publish',
    published: null,
    archived: null,
  };

  return (
    <div
      className="group relative flex flex-col gap-3 rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-5 shadow-xs transition-shadow hover:shadow-md"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-(--color-brand)/10 text-(--color-brand)"
        >
          <TemplateIcon className="size-4" strokeWidth={2} />
        </span>
        <Badge color={badge.color as Parameters<typeof Badge>[0]['color']}>{badge.label}</Badge>
      </div>

      <div className="flex-1">
        <p className="font-semibold leading-snug text-dc-text">{sop.title}</p>
        {sop.departments && (
          <p className="mt-1 text-xs text-dc-text-3">{sop.departments.name}</p>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-[color:var(--dc-edge)] pt-3">
        <span className="text-xs text-dc-text-3">
          {new Date(sop.updated_at).toLocaleDateString()}
        </span>
        {nextActionLabel[sop.status] && (
          <Button
            href={`/dashboard/sops/${sop.id}`}
            plain
            className="text-xs text-(--color-brand)"
          >
            {nextActionLabel[sop.status]} →
          </Button>
        )}
      </div>

      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 rounded-b-xl bg-(--color-brand) transition-transform duration-200 group-hover:scale-x-100"
      />
    </div>
  );
}

function ArchiveSopRow({ sop }: { sop: SopRow }) {
  const TemplateIcon = TEMPLATE_ICONS[sop.template];

  return (
    <div className="flex items-center gap-4 rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface px-5 py-4 transition-colors hover:bg-dc-raised">
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-dc-raised text-dc-text-3"
      >
        <TemplateIcon className="size-4" strokeWidth={1.5} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-dc-text">{sop.title}</p>
        <p className="mt-0.5 text-xs text-dc-text-3">
          {sop.departments?.name ?? 'No department'}
          {' · '}
          {TEMPLATE_LABELS[sop.template]}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <Badge color="signal-neutral">Archived</Badge>
        {sop.archived_at && (
          <p className="mt-1 text-xs text-dc-text-3">
            {new Date(sop.archived_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Empty states ──────────────────────────────────────────────────────────────

function LibraryEmptyState() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-8 shadow-xs">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-(--color-brand) opacity-10 blur-3xl"
      />
      <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <span
          aria-hidden
          className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-(--color-brand)/10 text-(--color-brand)"
        >
          <BookOpen className="size-7" strokeWidth={1.5} />
        </span>
        <div>
          <p className="font-display text-sm tracking-[0.15em] text-(--color-brand) uppercase">
            Library is empty
          </p>
          <h3 className="mt-1 text-xl font-semibold text-dc-text">No published SOPs yet</h3>
          <p className="mt-1 max-w-md text-dc-text-2">
            Build and publish your first SOP to see it appear here. Published SOPs are live for
            employees to scan and view.
          </p>
          <Button href="/dashboard/sops?tab=build" color="brand" className="mt-5">
            <Hammer data-slot="icon" strokeWidth={2} />
            Start building
          </Button>
        </div>
      </div>
    </div>
  );
}

function BuildEmptyState() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-8 shadow-xs">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-(--color-brand) opacity-10 blur-3xl"
      />
      <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <span
          aria-hidden
          className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-(--color-brand)/10 text-(--color-brand)"
        >
          <Hammer className="size-7" strokeWidth={1.5} />
        </span>
        <div>
          <p className="font-display text-sm tracking-[0.15em] text-(--color-brand) uppercase">
            Pipeline is clear
          </p>
          <h3 className="mt-1 text-xl font-semibold text-dc-text">No SOPs in progress</h3>
          <p className="mt-1 max-w-md text-dc-text-2">
            Create a new SOP to start the pipeline. Upload a PDF, Word doc, or plain text file
            and Claude will convert it to structured, bilingual Markdown.
          </p>
        </div>
      </div>
    </div>
  );
}

function ArchiveEmptyState() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-8 shadow-xs">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-(--color-brand) opacity-10 blur-3xl"
      />
      <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <span
          aria-hidden
          className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-dc-raised text-dc-text-3"
        >
          <Archive className="size-7" strokeWidth={1.5} />
        </span>
        <div>
          <p className="font-display text-sm tracking-[0.15em] text-dc-text-3 uppercase">
            Archive
          </p>
          <h3 className="mt-1 text-xl font-semibold text-dc-text">No archived SOPs</h3>
          <p className="mt-1 max-w-md text-dc-text-2">
            When you retire a published SOP it moves here. Archived SOPs are read-only — their
            QR codes return a "no longer available" message.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Shared error state ────────────────────────────────────────────────────────

function FetchError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-5">
      <AlertCircle className="mt-0.5 size-5 shrink-0 text-(--color-signal-urgent)" />
      <div>
        <p className="text-sm font-medium text-dc-text">Could not load SOPs</p>
        <p className="mt-1 text-xs text-dc-text-3">{message}</p>
      </div>
    </div>
  );
}
