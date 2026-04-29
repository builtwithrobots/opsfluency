import { FileText, ScanLine } from "lucide-react";
import Link from "next/link";

import { LanguageToggleClient } from "./_components/LanguageToggleClient";
import { AnnouncementsFeed } from "./_components/AnnouncementsFeed";
import { getCompanyContext } from "@/lib/auth/company-context";
import type { AnnouncementWithRead } from "@/lib/types/announcements";
import type { WorkerLanguage } from "@/lib/types/sop";

interface Props {
  searchParams: Promise<{ lang?: string }>;
}

export const metadata = {
  robots: "noindex",
  title: "Home · OpsFluency",
};

const STRINGS = {
  en: {
    greeting: "Welcome back",
    subtitle: "Procedures, announcements, and HR all in one place.",
    announcementsHeading: "Announcements",
    announcementsEmpty: "No announcements yet. Check back later.",
    announcementsMarkAllRead: "Mark all as read",
    announcementsAllTeams: "All Teams",
    announcementsUrgent: "URGENT",
    announcementsPinned: "Pinned",
    announcementsJustNow: "just now",
    announcementsUnreadCount: (n: number) => `${n} unread`,
    departmentsHeading: "Your departments",
    departmentsEmpty: "Your manager hasn't assigned you to a department yet.",
    quickActionsHeading: "Quick actions",
    scanLabel: "Scan a QR code",
    scanHint: "Open a procedure by scanning its tag.",
    sopsLabel: "Browse procedures",
    sopsHint: "All SOPs available to you.",
  },
  es: {
    greeting: "Bienvenido de nuevo",
    subtitle: "Procedimientos, anuncios y RR.HH. todo en un solo lugar.",
    announcementsHeading: "Anuncios",
    announcementsEmpty: "No hay anuncios todavía. Vuelve más tarde.",
    announcementsMarkAllRead: "Marcar todo como leído",
    announcementsAllTeams: "Todos los equipos",
    announcementsUrgent: "URGENTE",
    announcementsPinned: "Fijado",
    announcementsJustNow: "ahora mismo",
    announcementsUnreadCount: (n: number) => `${n} sin leer`,
    departmentsHeading: "Tus departamentos",
    departmentsEmpty: "Tu gerente aún no te ha asignado a un departamento.",
    quickActionsHeading: "Acciones rápidas",
    scanLabel: "Escanear un código QR",
    scanHint: "Abre un procedimiento escaneando su etiqueta.",
    sopsLabel: "Ver procedimientos",
    sopsHint: "Todos los SOPs disponibles para ti.",
  },
} as const;

export default async function WorkerHomePage({ searchParams }: Props) {
  const sp = await searchParams;
  const { userId, supabase, company_id } = await getCompanyContext();

  const [{ data: member }, { data: company }] = await Promise.all([
    supabase
      .from("company_members")
      .select("id, preferred_language")
      .eq("clerk_user_id", userId)
      .eq("company_id", company_id)
      .maybeSingle(),
    supabase
      .from("companies")
      .select("name")
      .eq("id", company_id)
      .maybeSingle(),
  ]);

  const persisted: WorkerLanguage = member?.preferred_language === "es" ? "es" : "en";
  const lang: WorkerLanguage =
    sp.lang === "es" ? "es" : sp.lang === "en" ? "en" : persisted;
  const t = STRINGS[lang];
  const companyName = company?.name ?? "";
  const memberId: string = member?.id ?? "";

  // Fetch employee's department memberships
  const { data: empDepts } = memberId
    ? await supabase
        .from("employee_departments")
        .select("department_id")
        .eq("member_id", memberId)
    : { data: [] };

  const deptIds = (empDepts ?? []).map((r: { department_id: string }) => r.department_id);

  // Fetch visible announcements: org-wide OR in employee's departments, not expired.
  // All filters must be applied before .order() — chaining filters onto a
  // PostgrestTransformBuilder (returned by .order()) is unreliable in postgrest-js v1.
  const now = new Date().toISOString();

  let announcements: AnnouncementWithRead[] = [];
  try {
    let annQuery = supabase
      .from("announcements")
      .select("*, departments(name)")
      .eq("company_id", company_id)
      .or(`expires_at.is.null,expires_at.gt.${now}`);

    if (deptIds.length > 0) {
      annQuery = annQuery.or(
        `department_id.is.null,department_id.in.(${deptIds.join(",")})`,
      );
    } else {
      annQuery = annQuery.is("department_id", null);
    }

    const { data: rawAnnouncements } = await annQuery
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });

    const announcementIds = (rawAnnouncements ?? []).map(
      (a: { id: string }) => a.id,
    );

    const { data: reads } =
      memberId && announcementIds.length > 0
        ? await supabase
            .from("announcement_reads")
            .select("announcement_id")
            .eq("company_member_id", memberId)
            .in("announcement_id", announcementIds)
        : { data: [] };

    const readSet = new Set(
      (reads ?? []).map((r: { announcement_id: string }) => r.announcement_id),
    );

    announcements = (rawAnnouncements ?? []).map(
      (a: {
        id: string;
        departments: { name: string } | null;
        [key: string]: unknown;
      }) => ({
        ...(a as unknown as AnnouncementWithRead),
        is_read: readSet.has(a.id),
        department_name: (a.departments as { name: string } | null)?.name ?? null,
      }),
    );
  } catch {
    // Announcements unavailable (e.g. table not yet migrated) — page still renders
  }

  return (
    <main className="mx-auto min-h-[100dvh] max-w-2xl px-5 py-6 sm:px-6 sm:py-10" lang={lang}>
      <header className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-[0.15em] text-(--color-brand) uppercase">
            OpsFluency
          </p>
          {companyName ? (
            <p className="mt-0.5 truncate text-sm font-medium text-dc-text-2">
              {companyName}
            </p>
          ) : null}
          <h1 className="font-display mt-2 text-2xl leading-tight font-bold text-dc-text">
            {t.greeting}
          </h1>
          <p className="mt-1 text-sm text-dc-text-2">{t.subtitle}</p>
        </div>
        <LanguageToggleClient current={lang} />
      </header>

      <div className="mb-8">
        <AnnouncementsFeed
          announcements={announcements}
          lang={lang}
          strings={{
            heading: t.announcementsHeading,
            empty: t.announcementsEmpty,
            markAllRead: t.announcementsMarkAllRead,
            allTeams: t.announcementsAllTeams,
            urgent: t.announcementsUrgent,
            pinned: t.announcementsPinned,
            justNow: t.announcementsJustNow,
          }}
        />
      </div>

      <section aria-labelledby="departments-heading" className="mb-8">
        <h2
          id="departments-heading"
          className="mb-3 text-base font-bold tracking-tight text-dc-text"
        >
          {t.departmentsHeading}
        </h2>
        <div className="rounded-xl border border-dc-edge bg-dc-surface p-5 text-center">
          <FileText className="mx-auto size-6 text-dc-text-3" strokeWidth={2} aria-hidden />
          <p className="mt-2 text-sm text-dc-text-2">{t.departmentsEmpty}</p>
        </div>
      </section>

      <section aria-labelledby="actions-heading">
        <h2
          id="actions-heading"
          className="mb-3 text-base font-bold tracking-tight text-dc-text"
        >
          {t.quickActionsHeading}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/app/scan"
            className="flex min-h-[88px] items-center gap-3 rounded-xl border border-dc-edge bg-dc-surface p-4 transition-colors hover:bg-dc-raised"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-(--color-brand)/10 text-(--color-brand)">
              <ScanLine className="size-6" strokeWidth={2} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-semibold text-dc-text">
                {t.scanLabel}
              </span>
              <span className="block text-xs text-dc-text-2">{t.scanHint}</span>
            </span>
          </Link>
          <Link
            href="/app/search"
            className="flex min-h-[88px] items-center gap-3 rounded-xl border border-dc-edge bg-dc-surface p-4 transition-colors hover:bg-dc-raised"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-(--color-brand)/10 text-(--color-brand)">
              <FileText className="size-6" strokeWidth={2} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-semibold text-dc-text">
                {t.sopsLabel}
              </span>
              <span className="block text-xs text-dc-text-2">{t.sopsHint}</span>
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
}
