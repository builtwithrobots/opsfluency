import { Bell, FileText, ScanLine } from "lucide-react";
import Link from "next/link";

import { LanguageToggleClient } from "./_components/LanguageToggleClient";
import { getCompanyContext } from "@/lib/auth/company-context";
import type { WorkerLanguage } from "@/lib/types/sop";

interface Props {
  searchParams: Promise<{ lang?: string }>;
}

export const metadata = {
  // Worker pages are always behind auth — keep them out of search.
  robots: "noindex",
  title: "Home · OpsFluency",
};

const STRINGS = {
  en: {
    greeting: "Welcome back",
    subtitle: "Procedures, announcements, and HR all in one place.",
    announcementsHeading: "Announcements",
    announcementsEmpty: "No announcements yet. Check back later.",
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
      .select("preferred_language")
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

      <section aria-labelledby="announcements-heading" className="mb-8">
        <h2
          id="announcements-heading"
          className="mb-3 text-sm font-semibold tracking-wide text-dc-text-2 uppercase"
        >
          {t.announcementsHeading}
        </h2>
        <div className="rounded-xl border border-dc-edge bg-dc-surface p-5 text-center">
          <Bell className="mx-auto size-6 text-dc-text-3" strokeWidth={2} aria-hidden />
          <p className="mt-2 text-sm text-dc-text-2">{t.announcementsEmpty}</p>
        </div>
      </section>

      <section aria-labelledby="departments-heading" className="mb-8">
        <h2
          id="departments-heading"
          className="mb-3 text-sm font-semibold tracking-wide text-dc-text-2 uppercase"
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
          className="mb-3 text-sm font-semibold tracking-wide text-dc-text-2 uppercase"
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
