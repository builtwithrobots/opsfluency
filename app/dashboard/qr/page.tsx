import { AlertCircle, Archive, ExternalLink, Image as ImageIcon, QrCode, ScanLine, Search, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AuthError, getCompanyContext } from '@/lib/auth/company-context';
import { isCurrentUserSuperAdmin } from '@/lib/auth/super-admin-context';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardTabs, type TabDef } from '@/components/dashboard/dashboard-tabs';
import QRPrintEditor from '@/components/qr/QRPrintEditor';
import { QrCardActions } from '@/components/qr/QrCardActions';
import { canModifyQr } from '@/lib/qr/audience';
import { getCreatorScope } from '@/lib/qr/creator-scope';
import { qrStatus } from '@/lib/qr/schedule';
import type { PrintConfig, QrTargetType } from '@/lib/qr/print-config';

const TYPE_LABELS: Record<QrTargetType, string> = {
  sop:           'SOP',
  announcement:  'Announcement',
  questionnaire: 'Questionnaire',
  url:           'URL',
};

interface PageProps {
  searchParams: Promise<{ tab?: string; q?: string; status?: string }>;
}

type StatusFilter = 'active' | 'archived';

export default async function QrCodesPage({ searchParams }: PageProps) {
  const { tab: rawTab, q = '', status: rawStatus } = await searchParams;
  const tab = rawTab === 'settings' ? 'settings' : 'all';
  const status: StatusFilter = rawStatus === 'archived' ? 'archived' : 'active';

  let ctx;
  try {
    ctx = await getCompanyContext('manager');
  } catch (e) {
    if (e instanceof AuthError) {
      // Super admins have no company_members row - send them to the
      // platform view. Employees are already redirected by the layout.
      if (e.code === 'NO_COMPANY' && (await isCurrentUserSuperAdmin())) {
        redirect('/dashboard/platform');
      }
      if (e.code === 'UNAUTHENTICATED') redirect('/sign-in');
    }
    throw e;
  }
  const { supabase, company_id, userId, role, impersonating } = ctx;
  const isAdmin = role === 'admin';

  const tabs: TabDef[] = [
    { id: 'all',      label: 'All QR Codes',   href: '/dashboard/qr?tab=all' },
    { id: 'settings', label: 'Design Settings', href: '/dashboard/qr?tab=settings',
      disabled: !isAdmin },
  ];

  /* ── Data fetching ────────────────────────────────────────────── */

  type QrRow = {
    id: string;
    label: string;
    target_type: string;
    created_at: string;
    created_by: string;
    archived_at: string | null;
    active_from: string | null;
    active_until: string | null;
  };
  let qrCodes: QrRow[] = [];
  let fetchError: string | null = null;
  let creatorScope: Awaited<ReturnType<typeof getCreatorScope>> | null = null;

  type ScanCounts = Map<string, { total: number; last7d: number }>;
  let scanCounts: ScanCounts = new Map();

  if (tab === 'all') {
    try {
      let query = supabase
        .from('qr_codes')
        .select('id, label, target_type, created_at, created_by, archived_at, active_from, active_until')
        .eq('company_id', company_id)
        .order(status === 'archived' ? 'archived_at' : 'created_at', { ascending: false });

      query = status === 'archived'
        ? query.not('archived_at', 'is', null)
        : query.is('archived_at', null);

      if (q) query = query.ilike('label', `%${q}%`);

      const { data, error } = await query;
      if (error) fetchError = error.message;
      else qrCodes = (data ?? []) as QrRow[];

      // Resolve once per page render — the per-card canModifyQr check is
      // a pure function over this scope object and the row's created_by.
      creatorScope = await getCreatorScope({
        supabase, userId, company_id, role, impersonating,
      });

      // Fetch scan counts for all visible QR codes in one query and
      // aggregate in JS — avoids N+1 and keeps a simple schema.
      if (qrCodes.length > 0) {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: scans } = await supabase
          .from('qr_scans')
          .select('qr_code_id, scanned_at')
          .in('qr_code_id', qrCodes.map(qr => qr.id));

        for (const row of (scans ?? [])) {
          const entry = scanCounts.get(row.qr_code_id) ?? { total: 0, last7d: 0 };
          entry.total++;
          if (row.scanned_at >= sevenDaysAgo) entry.last7d++;
          scanCounts.set(row.qr_code_id, entry);
        }
      }
    } catch {
      fetchError = 'Unable to load QR codes.';
    }
  }

  let company: {
    name: string | null;
    phone: string | null;
    logo_url: string | null;
    qr_design_defaults: Partial<PrintConfig> | null;
  } | null = null;
  if (tab === 'settings' && isAdmin) {
    // Fetch in two steps so a missing/optional column (e.g. qr_design_defaults
    // before its migration is applied) doesn't take down the whole branding
    // panel. The base fields are guaranteed to exist on companies.
    const { data: base, error: baseErr } = await supabase
      .from('companies')
      .select('name, phone, logo_url')
      .eq('id', company_id)
      .single();

    if (baseErr) {
      console.error('[qr/design-settings] company base read failed:', baseErr);
    }

    let qr_design_defaults: Partial<PrintConfig> | null = null;
    const { data: defaults, error: defaultsErr } = await supabase
      .from('companies')
      .select('qr_design_defaults')
      .eq('id', company_id)
      .single();
    if (defaultsErr) {
      // Most common cause: migration 20260426000001 not yet applied.
      console.warn('[qr/design-settings] qr_design_defaults unavailable:', defaultsErr.message);
    } else {
      qr_design_defaults = (defaults?.qr_design_defaults as Partial<PrintConfig>) ?? null;
    }

    if (base) {
      company = {
        name:               base.name,
        phone:              base.phone,
        logo_url:           base.logo_url,
        qr_design_defaults,
      };
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Heading>QR Code library</Heading>
          <Text className="mt-1.5 max-w-2xl">
            Permanent scan URLs for SOPs, announcements, and any destination. Print and post — they never expire.
          </Text>
        </div>
        <Button href="/dashboard/qr/new" color="brand">
          <QrCode data-slot="icon" strokeWidth={2} />
          New QR code
        </Button>
      </header>

      {/* Tab bar */}
      <DashboardTabs tabs={tabs} activeTab={tab} />

      {/* Tab panels */}
      {tab === 'all' && (
        <QrAllTab
          qrCodes={qrCodes}
          fetchError={fetchError}
          searchQuery={q}
          status={status}
          appUrl={appUrl}
          userId={userId}
          creatorScope={creatorScope}
          scanCounts={scanCounts}
        />
      )}

      {tab === 'settings' && isAdmin && (
        <QrDesignSettingsTab company={company} />
      )}
    </div>
  );
}

/* ── All QR Codes tab ───────────────────────────────────────────── */

type QrRowFull = {
  id: string;
  label: string;
  target_type: string;
  created_at: string;
  created_by: string;
  archived_at: string | null;
  active_from: string | null;
  active_until: string | null;
};

interface QrAllTabProps {
  qrCodes: QrRowFull[];
  fetchError: string | null;
  searchQuery: string;
  status: StatusFilter;
  appUrl: string;
  userId: string;
  creatorScope: Awaited<ReturnType<typeof getCreatorScope>> | null;
  scanCounts: Map<string, { total: number; last7d: number }>;
}

function QrAllTab({
  qrCodes,
  fetchError,
  searchQuery,
  status,
  appUrl,
  userId,
  creatorScope,
  scanCounts,
}: QrAllTabProps) {
  if (fetchError) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-5">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-(--color-signal-urgent)" />
        <div>
          <p className="text-sm font-medium text-dc-text">Could not load QR codes</p>
          <p className="mt-1 text-xs text-dc-text-3">{fetchError}</p>
        </div>
      </div>
    );
  }

  const baseHref = '/dashboard/qr?tab=all';

  return (
    <div className="flex flex-col gap-5">
      {/* Active / Archived sub-filter */}
      <div
        role="tablist"
        aria-label="QR code status"
        className="inline-flex w-fit rounded-md border border-[color:var(--dc-edge)] bg-dc-raised p-0.5 text-sm"
      >
        <StatusPill href={baseHref} active={status === 'active'} label="Active" />
        <StatusPill href={`${baseHref}&status=archived`} active={status === 'archived'} label="Archive" icon />
      </div>

      {/* Search bar */}
      <form action="/dashboard/qr" method="GET" className="flex items-center gap-2">
        <input type="hidden" name="tab" value="all" />
        {status === 'archived' && <input type="hidden" name="status" value="archived" />}
        <div className="relative flex-1 max-w-sm">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dc-text-3"
          />
          <input
            name="q"
            type="search"
            defaultValue={searchQuery}
            placeholder="Search by label…"
            className="w-full rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised py-2 pl-9 pr-3 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
          />
        </div>
        <Button type="submit" plain>
          Search
        </Button>
        {searchQuery && (
          <Button
            href={status === 'archived' ? `${baseHref}&status=archived` : baseHref}
            plain
          >
            Clear
          </Button>
        )}
      </form>

      {/* Results */}
      {!qrCodes.length ? (
        searchQuery ? (
          <div className="py-12 text-center text-sm text-dc-text-3">
            No QR codes match &ldquo;{searchQuery}&rdquo;.
          </div>
        ) : status === 'archived' ? (
          <ArchivedEmptyState />
        ) : (
          <QrEmptyState />
        )
      ) : (
        <>
          <p className="text-xs text-dc-text-3">
            {qrCodes.length} {qrCodes.length === 1 ? 'code' : 'codes'}
            {searchQuery ? ` matching "${searchQuery}"` : ''}
            {status === 'archived' ? ' in the archive' : ''}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {qrCodes.map((qr, i) => {
              const canManage = creatorScope
                ? canModifyQr({ qr, userId, scope: creatorScope })
                : false;
              return (
                <QrCard
                  key={qr.id}
                  qr={qr}
                  appUrl={appUrl}
                  index={i}
                  canManage={canManage}
                  counts={scanCounts.get(qr.id) ?? { total: 0, last7d: 0 }}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function StatusPill({
  href,
  active,
  label,
  icon,
}: {
  href: string;
  active: boolean;
  label: string;
  icon?: boolean;
}) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      className={[
        'inline-flex items-center gap-1.5 rounded-sm px-3 py-1 font-medium',
        active ? 'bg-(--color-brand) text-white' : 'text-dc-text-2 hover:text-dc-text',
      ].join(' ')}
    >
      {icon && <Archive className="size-3.5" strokeWidth={2} aria-hidden />}
      {label}
    </Link>
  );
}

/* ── Design Settings tab ────────────────────────────────────────── */

interface QrDesignSettingsTabProps {
  company: {
    name: string | null;
    phone: string | null;
    logo_url: string | null;
    qr_design_defaults: Partial<PrintConfig> | null;
  } | null;
}

function QrDesignSettingsTab({ company }: QrDesignSettingsTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-6">
        <div className="flex items-start gap-4">
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-(--color-brand)/10 text-(--color-brand)"
          >
            <Settings2 className="size-5" strokeWidth={1.5} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-dc-text">Global QR branding defaults</h2>
            <p className="mt-1 max-w-lg text-sm text-dc-text-2">
              These values auto-populate the header, footer, and logo on every new QR print sheet.
              Keeping them consistent prevents brand fragmentation across the worksite.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Logo */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase">
              Company logo
            </span>
            {company?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={company.logo_url}
                alt="Company logo"
                className="h-12 w-auto rounded object-contain"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded border border-dashed border-[color:var(--dc-edge)] text-dc-text-3">
                <ImageIcon className="size-5" strokeWidth={1.5} />
              </div>
            )}
          </div>

          {/* Company name */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase">
              Company name
            </span>
            <p className="text-sm font-medium text-dc-text">
              {company?.name ?? <span className="italic text-dc-text-3">Not set</span>}
            </p>
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase">
              Contact phone
            </span>
            <p className="text-sm font-medium text-dc-text">
              {company?.phone ?? <span className="italic text-dc-text-3">Not set</span>}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-[color:var(--dc-edge)] pt-4">
          <Button href="/dashboard/org-settings" plain className="text-sm">
            Edit in company settings →
          </Button>
        </div>
      </div>

      {/* Default print template - full editor */}
      <div className="rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-6">
        <div className="flex items-start gap-4">
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-(--color-brand)/10 text-(--color-brand)"
          >
            <QrCode className="size-5" strokeWidth={1.5} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-dc-text">Default print template</h2>
            <p className="mt-1 max-w-lg text-sm text-dc-text-2">
              The starting point for every new QR code. Typography, sizing, and section
              visibility set here apply to new prints; existing QR codes keep their own settings.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <QRPrintEditor
            mode="defaults"
            targetType="sop"
            initialConfig={company?.qr_design_defaults ?? undefined}
            companyName={company?.name ?? undefined}
            logoUrl={company?.logo_url}
            companyPhone={company?.phone}
            saveEndpoint="/api/qr/design-defaults"
            showPrintButton={false}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Empty state ────────────────────────────────────────────────── */

function QrEmptyState() {
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
          <QrCode className="size-7" strokeWidth={1.5} />
        </span>
        <div>
          <h3 className="text-xl font-semibold text-dc-text">No QR codes yet</h3>
          <p className="mt-1 max-w-md text-dc-text-2">
            Create a QR code and print it to any surface. The URL never changes - scans always
            resolve to the current content.
          </p>
          <Button href="/dashboard/qr/new" color="brand" className="mt-5">
            <QrCode data-slot="icon" strokeWidth={2} />
            Create your first QR code
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── QR card ────────────────────────────────────────────────────── */

interface QrCardProps {
  qr: QrRowFull;
  appUrl: string;
  index: number;
  canManage: boolean;
  counts: { total: number; last7d: number };
}

function QrCard({ qr, appUrl, index, canManage, counts }: QrCardProps) {
  const scanUrl = `${appUrl}/s/${qr.id}`;
  const archived = !!qr.archived_at;

  return (
    <div
      className={[
        'group relative flex flex-col gap-4 rounded-xl border bg-dc-surface p-5 shadow-xs transition-shadow hover:shadow-md',
        archived ? 'border-dashed border-[color:var(--dc-edge)] opacity-90' : 'border-[color:var(--dc-edge)]',
      ].join(' ')}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Top row: icon | badges + stats stacked right */}
      <div className="flex items-start justify-between gap-2">
        <span
          aria-hidden
          className="flex size-9 items-center justify-center rounded-lg bg-(--color-brand)/10 text-(--color-brand)"
        >
          <QrCode className="size-4" strokeWidth={2} />
        </span>
        <div className="flex flex-col items-end gap-1">
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <ScheduleBadges qr={qr} />
            <Badge color="zinc">
              {TYPE_LABELS[qr.target_type as QrTargetType] ?? qr.target_type}
            </Badge>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1.5 text-xs text-dc-text-3">
              <ScanLine className="h-3.5 w-3.5 shrink-0" />
              <span>{counts.total.toLocaleString()} {counts.total === 1 ? 'scan' : 'scans'}</span>
            </div>
            {counts.last7d > 0 && (
              <p className="text-[10px] text-dc-text-3">
                {counts.last7d.toLocaleString()} this week
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Label */}
      <div className="flex-1">
        <p className="font-semibold text-dc-text">
          {qr.label || <span className="italic text-dc-text-3">Unlabelled</span>}
        </p>
        <a
          href={scanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-dc-text-3 hover:text-(--color-brand)"
        >
          /s/{qr.id.slice(0, 8)}…
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Footer: actions */}
      <div className="flex items-center justify-end gap-2 border-t border-[color:var(--dc-edge)] pt-3">
        <QrCardActions
          qr_id={qr.id}
          qr_label={qr.label}
          archived={archived}
          canManage={canManage}
        />
        {!archived && (
          <Link
            href={`/dashboard/qr/${qr.id}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--dc-edge)] bg-dc-raised h-9 px-2.5 text-sm font-semibold text-dc-text-2 transition-colors hover:text-dc-text"
          >
            Edit / Print
          </Link>
        )}
      </div>

      {/* Brand underline on hover */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 rounded-b-xl bg-(--color-brand) transition-transform duration-200 group-hover:scale-x-100"
      />
    </div>
  );
}

function ScheduleBadges({ qr }: { qr: QrRowFull }) {
  // SOP QRs piggyback on the SOP's own status; in the library they only
  // ever show as Active. Scheduling is disabled at the schema level for
  // sop rows and intentionally not surfaced in the badge area.
  if (qr.target_type === 'sop') {
    return <Badge color="signal-ok">Active</Badge>;
  }

  // Archived takes precedence over schedule — showing both is noisy and
  // the manager already navigated to the Archive sub-tab to see this row.
  if (qr.archived_at) {
    return <Badge color="zinc">Archived</Badge>;
  }

  const status = qrStatus(qr);
  return (
    <>
      {status.state === 'active' ? (
        <Badge color="signal-ok">Active</Badge>
      ) : (
        <Badge color="signal-warn">Inactive</Badge>
      )}
      <Badge color="zinc">
        {status.schedule === 'scheduled' ? 'Date Range' : 'No Schedule'}
      </Badge>
    </>
  );
}

function ArchivedEmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-5 py-10 text-center">
      <span
        aria-hidden
        className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-dc-raised text-dc-text-3"
      >
        <Archive className="size-5" strokeWidth={1.5} />
      </span>
      <p className="text-sm font-medium text-dc-text">The archive is empty</p>
      <p className="mt-1 text-xs text-dc-text-3">
        Codes you archive from the Active list show up here. Restore brings
        them back; delete removes them permanently.
      </p>
    </div>
  );
}
