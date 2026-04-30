import { AlertCircle, ChevronDown, Download, Search, Upload } from 'lucide-react';
import { redirect } from 'next/navigation';
import Link from 'next/link';

import { AuthError, getCompanyContext } from '@/lib/auth/company-context';
import { isCurrentUserSuperAdmin } from '@/lib/auth/super-admin-context';
import { getCreatorScope } from '@/lib/qr/creator-scope';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { SOP_STATUS, type SopStatus } from '@/lib/types/sop';
import type { Tag } from '@/lib/types/tags';
import { UploadSopClient } from './_components/UploadSopClient';
import { SopListClient, type SopRowWithTags } from './_components/SopListClient';
import { SopTagFilterBar } from './_components/SopTagFilterBar';

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    tag?: string;
  }>;
}

interface QrRow {
  target_id: string | null;
  id: string;
}

export default async function SopsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = (params.q ?? '').trim();
  const statusFilter: SopStatus | 'all' = (SOP_STATUS as readonly string[]).includes(params.status ?? '')
    ? (params.status as SopStatus)
    : 'all';
  const tagId = params.tag ?? null;

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
  const { userId, supabase, company_id, role, impersonating } = ctx;

  // ── Fetch SOPs (optionally filtered by tag) ─────────────────────────────────
  let sopIds: string[] | null = null;
  if (tagId) {
    const { data: taggedRows } = await supabase
      .from('sop_tags')
      .select('sop_id')
      .eq('tag_id', tagId);
    sopIds = (taggedRows ?? []).map((r: { sop_id: string }) => r.sop_id);
  }

  const sopsPromise = (async () => {
    let query = supabase
      .from('sops')
      .select('id, title, status, updated_at, archived_at, departments(id, name)')
      .eq('company_id', company_id)
      .order('updated_at', { ascending: false });
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (q) query = query.ilike('title', `%${q}%`);
    if (sopIds !== null) {
      if (sopIds.length === 0) return { data: [], error: null };
      query = query.in('id', sopIds);
    }
    return query;
  })();

  const [{ data: sopRows, error: sopsError }, allTagsResult, { data: deptCount }] = await Promise.all([
    sopsPromise,
    supabase
      .from('tags')
      .select('*')
      .eq('company_id', company_id)
      .order('source', { ascending: false })
      .order('name_en', { ascending: true }),
    supabase
      .from('departments')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', company_id),
  ]);
  void deptCount;

  const allTags = (allTagsResult.data ?? []) as Tag[];
  const baseSops = (sopRows ?? []) as unknown as Omit<SopRowWithTags, 'tags'>[];

  // Resolve QR ids for published SOPs.
  const publishedIds = baseSops.filter((s) => s.status === 'published').map((s) => s.id);
  let qrByTargetId: Record<string, string> = {};
  if (publishedIds.length > 0) {
    const { data: qrRows } = await supabase
      .from('qr_codes')
      .select('id, target_id')
      .eq('company_id', company_id)
      .eq('target_type', 'sop')
      .in('target_id', publishedIds);
    qrByTargetId = Object.fromEntries(
      ((qrRows ?? []) as QrRow[])
        .filter((q): q is QrRow & { target_id: string } => !!q.target_id)
        .map((q) => [q.target_id, q.id]),
    );
  }

  // Fetch tag assignments for the visible SOPs.
  const visibleSopIds = baseSops.map((s) => s.id);
  let tagsBySOPId = new Map<string, Tag[]>();
  if (visibleSopIds.length > 0) {
    const { data: assignments } = await supabase
      .from('sop_tags')
      .select('sop_id, tags(*)')
      .in('sop_id', visibleSopIds);
    for (const row of assignments ?? []) {
      const r = row as unknown as { sop_id: string; tags: Tag };
      if (!tagsBySOPId.has(r.sop_id)) tagsBySOPId.set(r.sop_id, []);
      tagsBySOPId.get(r.sop_id)!.push(r.tags);
    }
  }

  const sops: SopRowWithTags[] = baseSops.map((s) => ({
    ...s,
    tags: tagsBySOPId.get(s.id) ?? [],
  }));

  // Departments for the upload dialog.
  const [{ data: departments = [] }, creatorScope] = await Promise.all([
    supabase.from('departments').select('id, name').eq('company_id', company_id).order('name'),
    getCreatorScope({ supabase, userId, company_id, role, impersonating }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Heading>Standard Operating Procedures</Heading>
          <Text className="mt-1.5 max-w-2xl">
            Upload, review, translate, and publish bilingual procedures. Each published SOP gets a
            permanent QR code your workers can scan.
          </Text>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-dc-text-3">Sample SOPs:</span>
            <a
              href="/examples/example-sop.docx"
              download
              className="flex items-center gap-1.5 rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-2.5 py-1 text-xs text-dc-text-2 transition-colors hover:border-(--color-brand)/40 hover:text-(--color-brand)"
            >
              <Download className="size-3 shrink-0" strokeWidth={2} aria-hidden />
              Example SOP (DOCX)
            </a>
            <a
              href="/examples/example-sop.pdf"
              download
              className="flex items-center gap-1.5 rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-2.5 py-1 text-xs text-dc-text-2 transition-colors hover:border-(--color-brand)/40 hover:text-(--color-brand)"
            >
              <Download className="size-3 shrink-0" strokeWidth={2} aria-hidden />
              Example SOP (PDF)
            </a>
          </div>
        </div>
        <UploadSopClient
          departments={(departments ?? []) as { id: string; name: string }[]}
          scope={creatorScope}
        />
      </header>

      <form
        action="/dashboard/sops"
        method="GET"
        className="flex flex-wrap items-center gap-2"
      >
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dc-text-3" />
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search by title…"
            className="w-full rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised py-2 pl-9 pr-3 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
          />
        </div>
        <div className="relative">
          <select
            name="status"
            defaultValue={statusFilter}
            className="appearance-none rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised py-2 pl-3 pr-8 text-sm text-dc-text focus:border-(--color-brand) focus:outline-none"
          >
            <option value="all">All statuses</option>
            {SOP_STATUS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown aria-hidden className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-dc-text-3" />
        </div>
        <button
          type="submit"
          className="rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text hover:bg-dc-surface"
        >
          Apply
        </button>
        {(q || statusFilter !== 'all') && (
          <Link
            href="/dashboard/sops"
            className="rounded-lg px-3 py-2 text-sm text-dc-text-3 hover:text-dc-text"
          >
            Clear
          </Link>
        )}
      </form>

      {allTags.length > 0 && (
        <SopTagFilterBar
          allTags={allTags}
          activeTagId={tagId}
          q={q}
          status={statusFilter}
        />
      )}

      {sopsError && (
        <div className="flex items-start gap-3 rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-5">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-(--color-signal-urgent)" />
          <div>
            <p className="text-sm font-medium text-dc-text">Could not load SOPs</p>
            <p className="mt-1 text-xs text-dc-text-3">{sopsError.message}</p>
          </div>
        </div>
      )}

      {!sopsError && sops.length === 0 && (
        <EmptyState filtered={!!q || statusFilter !== 'all' || !!tagId} />
      )}

      {sops.length > 0 && (
        <SopListClient
          sops={sops}
          allTags={allTags}
          qrByTargetId={qrByTargetId}
        />
      )}
    </div>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  if (filtered) {
    return (
      <div className="rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface px-5 py-10 text-center text-sm text-dc-text-3">
        No SOPs match your filters.
      </div>
    );
  }
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
          <Upload className="size-7" strokeWidth={1.5} />
        </span>
        <div>
          <h3 className="text-xl font-semibold text-dc-text">Upload your first SOP</h3>
          <p className="mt-1 max-w-md text-dc-text-2">
            Drop a PDF, photo, or text file. Claude reads it, builds clean Markdown, flags
            site-specific terms, and translates to Spanish — all in one pass.
          </p>
        </div>
      </div>
    </div>
  );
}
