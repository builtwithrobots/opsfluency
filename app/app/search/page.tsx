import { FileText, Search } from "lucide-react";

import { LanguageToggleClient } from "@/app/app/home/_components/LanguageToggleClient";
import { getCompanyContext } from "@/lib/auth/company-context";
import type { WorkerLanguage } from "@/lib/types/sop";

interface Props {
  searchParams: Promise<{ lang?: string }>;
}

export const metadata = {
  robots: "noindex",
  title: "SOPs · OpsFluency",
};

const STRINGS = {
  en: {
    eyebrow: "SOPs",
    heading: "Browse procedures",
    subtitle: "Search and tap to read.",
    searchPlaceholder: "Search procedures",
    empty: "Procedure browsing arrives soon. Use Scan to open a procedure now.",
  },
  es: {
    eyebrow: "SOPs",
    heading: "Explorar procedimientos",
    subtitle: "Busca y toca para leer.",
    searchPlaceholder: "Buscar procedimientos",
    empty: "La búsqueda de procedimientos llega pronto. Usa Escanear para abrir uno ahora.",
  },
} as const;

export default async function WorkerSearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { userId, supabase, company_id } = await getCompanyContext();

  const { data: member } = await supabase
    .from("company_members")
    .select("preferred_language")
    .eq("clerk_user_id", userId)
    .eq("company_id", company_id)
    .maybeSingle();

  const persisted: WorkerLanguage =
    member?.preferred_language === "es" ? "es" : "en";
  const lang: WorkerLanguage =
    sp.lang === "es" ? "es" : sp.lang === "en" ? "en" : persisted;
  const t = STRINGS[lang];

  return (
    <main
      className="mx-auto min-h-[100dvh] max-w-2xl px-5 py-6 sm:px-6 sm:py-10"
      lang={lang}
    >
      <header className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-[0.15em] text-(--color-brand) uppercase">
            {t.eyebrow}
          </p>
          <h1 className="font-display mt-2 text-2xl leading-tight font-bold text-dc-text">
            {t.heading}
          </h1>
          <p className="mt-1 text-sm text-dc-text-2">{t.subtitle}</p>
        </div>
        <LanguageToggleClient current={lang} />
      </header>

      <div className="mb-6 flex items-center gap-2 rounded-xl border border-dc-edge bg-dc-surface px-4 py-3">
        <Search className="size-4 shrink-0 text-dc-text-3" strokeWidth={2} aria-hidden />
        <input
          type="search"
          placeholder={t.searchPlaceholder}
          disabled
          className="min-h-[44px] w-full bg-transparent text-base text-dc-text placeholder:text-dc-text-3 focus:outline-none disabled:cursor-not-allowed"
        />
      </div>

      <div className="rounded-xl border border-dc-edge bg-dc-surface p-6 text-center">
        <FileText className="mx-auto size-6 text-dc-text-3" strokeWidth={2} aria-hidden />
        <p className="mt-2 text-sm text-dc-text-2">{t.empty}</p>
      </div>
    </main>
  );
}
