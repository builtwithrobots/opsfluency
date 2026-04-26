import { ScanLine } from "lucide-react";

import { LanguageToggleClient } from "@/app/app/home/_components/LanguageToggleClient";
import { getCompanyContext } from "@/lib/auth/company-context";
import type { WorkerLanguage } from "@/lib/types/sop";

import { ScanClient } from "./_components/ScanClient";

interface Props {
  searchParams: Promise<{ lang?: string }>;
}

export const metadata = {
  robots: "noindex",
  title: "Scan · OpsFluency",
};

const STRINGS = {
  en: {
    eyebrow: "Scan",
    heading: "Scan a procedure tag",
    subtitle: "Point your camera at the QR code on the equipment.",
  },
  es: {
    eyebrow: "Escanear",
    heading: "Escanea una etiqueta",
    subtitle: "Apunta la cámara al código QR del equipo.",
  },
} as const;

export default async function WorkerScanPage({ searchParams }: Props) {
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

  // Origin used to validate scanned URLs. The scanner only navigates
  // when the QR points to ${appOrigin}/s/<id>; everything else is shown
  // as raw text so the worker can copy or report it without us
  // navigating to an arbitrary URL.
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <main
      className="mx-auto min-h-[100dvh] max-w-2xl px-5 py-6 sm:px-6 sm:py-10"
      lang={lang}
    >
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-[0.15em] text-(--color-brand) uppercase">
            <ScanLine className="mr-1 inline size-3.5" strokeWidth={2.5} aria-hidden />
            {t.eyebrow}
          </p>
          <h1 className="font-display mt-2 text-2xl leading-tight font-bold text-dc-text">
            {t.heading}
          </h1>
          <p className="mt-1 text-sm text-dc-text-2">{t.subtitle}</p>
        </div>
        <LanguageToggleClient current={lang} />
      </header>

      <ScanClient lang={lang} appOrigin={appOrigin} />
    </main>
  );
}
