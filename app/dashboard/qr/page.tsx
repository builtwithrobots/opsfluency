import { AlertCircle, ExternalLink, Image as ImageIcon, QrCode, ScanLine, Search, Settings2 } from 'lucide-react';

import { redirect } from 'next/navigation';

import { AuthError, getCompanyContext } from '@/lib/auth/company-context';
import { isCurrentUserSuperAdmin } from '@/lib/auth/super-admin-context';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardTabs, type TabDef } from '@/components/dashboard/dashboard-tabs';
import QRPrintEditor from '@/components/qr/QRPrintEditor';
import type { PrintConfig, QrTargetType } from '@/lib/qr/print-config';

const TYPE_LABELS: Record<QrTargetType, string> = {
  sop:           'SOP',
  announcement:  'Announcement',
  questionnaire: 'Questionnaire',
  url:           'URL',
};

interface PageProps {
  searchParams: Promise<{ tab?: string; q?: string }>;
}

export default async function QrCodesPage({ searchParams }: PageProps) {
  const { tab: rawTab, q = '' } = await searchParams;
  const tab = rawTab === 'settings' ? 'settings' : 'all';

  let ctx;
  try {
    ctx = await getCompanyContext('manager');
  } catch (e) {
    if (e instanceof AuthError) {
      // Super admins have no company_members row — send them to the
      // platform view. Employees are already redirected by the layout.
      if (e.code === 'NO_COMPANY' && (await isCurrentUserSuperAdmin())) {
        redirect('/dashboard/platform');
      }
      if (e.code === 'UNAUTHENTICATED') redirect('/sign-in');
    }
    throw e;
  }
  const { supabase, company_id, role } = ctx;
  const isAdmin = role === 'admin';

  const tabs: TabDef[] = [
    { id: 'all',      label: 'All QR Codes',   href: '/dashboard/qr?tab=all' },
    { id: 'settings', label: 'Design Settings', href: '/dashboard/qr?tab=settings',
      disabled: !isAdmin },
  ];

  /* ── Data fetching ────────────────────────────────────────────── */

  let qrCodes: { id: string; label: string; target_type: string; created_at: string }[] = [];
  let fetchError: string | null = null;

  if (tab === 'all') {
    try {
      let query = supabase
        .from('qr_codes')
        .select('id, label, target_type, created_at')
        .eq('company_id', company_id)
        .order('created_at', { ascending: false });

      if (q) query = query.ilike('label', `%${q}%`);

      const { data, error } = await query;
      if (error) fetchError = error.message;
      else qrCodes = data ?? [];
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
    const { data } = await supabase
      .from('companies')
      .select('name, phone, logo_url, qr_design_defaults')
      .eq('id', company_id)
      .single();
    company = data as typeof company;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.15em] text-(--color-brand) uppercase">
            QR Codes
          </p>
          <Heading className="font-display mt-2">QR Code library</Heading>
          <Text className="mt-2 max-w-2xl">
            Permanent scan URLs for SOPs, announcements, and any destination.
            Print and post — they never expire.
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
          appUrl={appUrl}
        />
      )}

      {tab === 'settings' && isAdmin && (
        <QrDesignSettingsTab company={company} />
      )}
    </div>
  );
}

/* ── All QR Codes tab ───────────────────────────────────────────── */

interface QrAllTabProps {
  qrCodes: { id: string; label: string; target_type: string; created_at: string }[];
  fetchError: string | null;
  searchQuery: string;
  appUrl: string;
}

function QrAllTab({ qrCodes, fetchError, searchQuery, appUrl }: QrAllTabProps) {
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

  return (
    <div className="flex flex-col gap-5">
      {/* Search bar */}
      <form action="/dashboard/qr" method="GET" className="flex items-center gap-2">
        <input type="hidden" name="tab" value="all" />
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
          <Button href="/dashboard/qr?tab=all" plain>
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
        ) : (
          <QrEmptyState />
        )
      ) : (
        <>
          <p className="text-xs text-dc-text-3">
            {qrCodes.length} {qrCodes.length === 1 ? 'code' : 'codes'}
            {searchQuery ? ` matching "${searchQuery}"` : ''}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {qrCodes.map((qr, i) => (
              <QrCard key={qr.id} qr={qr} appUrl={appUrl} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
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
          <Button href="/dashboard/settings" plain className="text-sm">
            Edit in company settings →
          </Button>
        </div>
      </div>

      {/* Default print template — full editor */}
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
          <p className="font-display text-sm tracking-[0.15em] text-(--color-brand) uppercase">
            Getting started
          </p>
          <h3 className="mt-1 text-xl font-semibold text-dc-text">No QR codes yet</h3>
          <p className="mt-1 max-w-md text-dc-text-2">
            Create a QR code and print it to any surface. The URL never changes — scans always
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
  qr: { id: string; label: string; target_type: string; created_at: string };
  appUrl: string;
  index: number;
}

function QrCard({ qr, appUrl, index }: QrCardProps) {
  const scanUrl = `${appUrl}/s/${qr.id}`;

  return (
    <div
      className="group relative flex flex-col gap-4 rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-5 shadow-xs transition-shadow hover:shadow-md"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Top row: icon + type badge */}
      <div className="flex items-start justify-between">
        <span
          aria-hidden
          className="flex size-9 items-center justify-center rounded-lg bg-(--color-brand)/10 text-(--color-brand)"
        >
          <QrCode className="size-4" strokeWidth={2} />
        </span>
        <Badge color="zinc">
          {TYPE_LABELS[qr.target_type as QrTargetType] ?? qr.target_type}
        </Badge>
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

      {/* Footer row: date + action */}
      <div className="flex items-center justify-between border-t border-[color:var(--dc-edge)] pt-3">
        <div className="flex items-center gap-1.5 text-xs text-dc-text-3">
          <ScanLine className="h-3.5 w-3.5" />
          {new Date(qr.created_at).toLocaleDateString()}
        </div>
        <Button href={`/dashboard/qr/${qr.id}`} plain className="text-sm">
          Edit / Print
        </Button>
      </div>

      {/* Brand underline on hover */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 rounded-b-xl bg-(--color-brand) transition-transform duration-200 group-hover:scale-x-100"
      />
    </div>
  );
}
