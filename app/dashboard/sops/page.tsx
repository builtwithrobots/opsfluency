import { AlertCircle, ChevronDown, FileText, Search, Upload } from 'lucide-react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

import { AuthError, getCompanyContext } from '@/lib/auth/company-context';
import { isCurrentUserSuperAdmin } from '@/lib/auth/super-admin-context';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { SOP_STATUS, type SopStatus } from '@/lib/types/sop';
import { UploadSopClient } from './_components/UploadSopClient';

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
}

interface SopRow {
  id: string;
  title: string;
  status: SopStatus;
  updated_at: string;
  archived_at: string | null;
  departments: { id: string; name: string } | null;
}

interface QrRow {
  target_id: string | null;
  id: string;
}

const STATUS_LABEL: Record<SopStatus, { label: string; color: Parameters<typeof Badge>[0]['color'] }> = {
  draft:                { label: 'Draft',                color: 'zinc' },
  pending_terms:        { label: 'Pending Terms',         color: 'signal-warn' },
  pending_translation:  { label: 'Pending Translation',   color: 'signal-info' },
  pending_approval:     { label: 'Pending Approval',      color: 'signal-hub' },
  published:            { label: 'Published',             color: 'signal-ok' },
  archived:             { label: 'Archived',              color: 'signal-neutral' },
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? '';

export default async function SopsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = (params.q ?? '').trim();
  const statusFilter: SopStatus | 'all' = (SOP_STATUS as readonly string[]).includes(params.status ?? '')
    ? (params.status as SopStatus)
    : 'all';

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
  const { supabase, company_id } = ctx;

  // ── Fetch SOPs + departments in parallel ─────────────────────────────────
  const sopsPromise = (async () => {
    let query = supabase
      .from('sops')
      .select('id, title, status, updated_at, archived_at, departments(id, name)')
      .eq('company_id', company_id)
      .order('updated_at', { ascending: false });
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (q) query = query.ilike('title', `%${q}%`);
    return query;
  })();

  const [{ data: sopRows, error: sopsError }, { data: deptCount }] = await Promise.all([
    sopsPromise,
    supabase
      .from('departments')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', company_id),
  ]);
  // deptCount is unused in MVP; the variable exists so Supabase actually
  // runs the count query as a sanity check that RLS lets the manager see
  // their tenant data. Remove if it ever shows up in profiling.
  void deptCount;

  const sops: SopRow[] = (sopRows ?? []) as unknown as SopRow[];

  // Resolve QR ids for any published SOP in the result set.
  const publishedIds = sops.filter((s) => s.status === 'published').map((s) => s.id);
  let qrByTargetId = new Map<string, string>();
  if (publishedIds.length > 0) {
    const { data: qrRows } = await supabase
      .from('qr_codes')
      .select('id, target_id')
      .eq('company_id', company_id)
      .eq('target_type', 'sop')
      .in('target_id', publishedIds);
    qrByTargetId = new Map(
      ((qrRows ?? []) as QrRow[])
        .filter((q): q is QrRow & { target_id: string } => !!q.target_id)
        .map((q) => [q.target_id, q.id]),
    );
  }

  // Departments for the upload dialog.
  const { data: departments = [] } = await supabase
    .from('departments')
    .select('id, name')
    .eq('company_id', company_id)
    .order('name');

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.15em] text-(--color-brand) uppercase">
            SOPs
          </p>
          <Heading className="font-display mt-2">Standard Operating Procedures</Heading>
          <Text className="mt-2 max-w-2xl">
            Upload, review, translate, and publish bilingual procedures. Each published SOP gets a
            permanent QR code your workers can scan.
          </Text>
        </div>
        <UploadSopClient departments={(departments ?? []) as { id: string; name: string }[]} />
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
              <option key={s} value={s}>{STATUS_LABEL[s].label}</option>
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

      {sopsError && (
        <div className="flex items-start gap-3 rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-5">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-(--color-signal-urgent)" />
          <div>
            <p className="text-sm font-medium text-dc-text">Could not load SOPs</p>
            <p className="mt-1 text-xs text-dc-text-3">{sopsError.message}</p>
          </div>
        </div>
      )}

      {!sopsError && sops.length === 0 && <EmptyState filtered={!!q || statusFilter !== 'all'} />}

      {sops.length > 0 && (
        <ul className="flex flex-col gap-2">
          {sops.map((sop) => (
            <SopRowItem
              key={sop.id}
              sop={sop}
              qrId={qrByTargetId.get(sop.id) ?? null}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function SopRowItem({ sop, qrId }: { sop: SopRow; qrId: string | null }) {
  const meta = STATUS_LABEL[sop.status];

  return (
    <li>
      <Link
        href={`/dashboard/sops/${sop.id}`}
        className="group flex items-center gap-4 rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface px-4 py-3 transition-colors hover:bg-dc-raised"
      >
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-(--color-brand)/10 text-(--color-brand)"
        >
          <FileText className="size-5" strokeWidth={1.75} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-dc-text">{sop.title}</p>
          <p className="mt-0.5 text-xs text-dc-text-3">
            {sop.departments?.name ?? 'No department'}
            <span className="mx-1.5">·</span>
            Updated {new Date(sop.updated_at).toLocaleDateString()}
          </p>
        </div>

        <Badge color={meta.color}>{meta.label}</Badge>

        {qrId ? (
          <span
            aria-label="QR thumbnail"
            className="hidden shrink-0 rounded-md bg-white p-1 sm:block"
          >
            <QRCodeSVG
              value={`${APP_URL}/s/${qrId}`}
              size={48}
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
              includeMargin={false}
            />
          </span>
        ) : (
          <span aria-hidden className="hidden size-[48px] shrink-0 sm:block" />
        )}
      </Link>
    </li>
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
          <p className="font-display text-sm tracking-[0.15em] text-(--color-brand) uppercase">
            Get started
          </p>
          <h3 className="mt-1 text-xl font-semibold text-dc-text">Upload your first SOP</h3>
          <p className="mt-1 max-w-md text-dc-text-2">
            Drop a PDF, photo, or text file. Claude reads it, builds clean Markdown, flags
            site-specific terms, and translates to Spanish — all in one pass.
          </p>
        </div>
      </div>
    </div>
  );
}
