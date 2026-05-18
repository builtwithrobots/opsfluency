import { BookOpenText, FileText, Search } from "lucide-react";
import Link from "next/link";

import { LanguageToggle } from "@/components/app/LanguageToggle";
import { getCompanyContext } from "@/lib/auth/company-context";
import type { WorkerLanguage } from "@/lib/types/sop";
import type { Tag } from "@/lib/types/tags";

interface Props {
  searchParams: Promise<{ lang?: string; tag?: string }>;
}

export const metadata = {
  robots: "noindex",
  title: "Search · OpsFluency",
};

const STRINGS = {
  en: {
    eyebrow: "Search",
    heading: "Browse procedures",
    subtitle: "Filter by label to find procedures and terms.",
    searchPlaceholder: "Search procedures",
    searchDisabled: "Procedure search coming soon. Filter by label below.",
    labelsHeading: "Browse by label",
    proceduresHeading: "Procedures",
    glossaryHeading: "Glossary",
    noResults: "No published procedures found for this label.",
    noGlossaryResults: "No glossary terms found for this label.",
    selectLabel: "Select a label above to browse related procedures and terms.",
    clearFilter: "Clear filter",
  },
  es: {
    eyebrow: "Buscar",
    heading: "Explorar procedimientos",
    subtitle: "Filtra por etiqueta para encontrar procedimientos y términos.",
    searchPlaceholder: "Buscar procedimientos",
    searchDisabled: "La búsqueda llega pronto. Filtra por etiqueta abajo.",
    labelsHeading: "Explorar por etiqueta",
    proceduresHeading: "Procedimientos",
    glossaryHeading: "Glosario",
    noResults: "No se encontraron procedimientos publicados para esta etiqueta.",
    noGlossaryResults: "No se encontraron términos del glosario para esta etiqueta.",
    selectLabel: "Selecciona una etiqueta para explorar procedimientos y términos relacionados.",
    clearFilter: "Quitar filtro",
  },
} as const;

interface SopResult {
  id: string;
  title: string;
  departments: { id: string; name: string } | null;
}

interface GlossaryResult {
  id: string;
  term_en: string;
  term_es: string;
  definition_en: string | null;
  definition_es: string | null;
}

export default async function WorkerSearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { userId, supabase, company_id } = await getCompanyContext();

  const { data: memberRow } = await supabase
    .from("company_members")
    .select("id, preferred_language")
    .eq("clerk_user_id", userId)
    .eq("company_id", company_id)
    .maybeSingle();

  const persisted: WorkerLanguage =
    memberRow?.preferred_language === "es" ? "es" : "en";
  const lang: WorkerLanguage =
    sp.lang === "es" ? "es" : sp.lang === "en" ? "en" : persisted;
  const t = STRINGS[lang];
  const tagId = sp.tag ?? null;

  // Load company tags for the filter bar.
  const { data: tagsData } = await supabase
    .from("tags")
    .select("*")
    .eq("company_id", company_id)
    .order("source", { ascending: false })
    .order("name_en", { ascending: true });
  const allTags = (tagsData ?? []) as Tag[];

  // Get employee's department IDs for scoping SOP results.
  let deptIds: string[] = [];
  if (memberRow?.id) {
    const { data: deptRows } = await supabase
      .from("employee_departments")
      .select("department_id")
      .eq("member_id", memberRow.id);
    deptIds = (deptRows ?? []).map((r: { department_id: string }) => r.department_id);
  }

  // When a tag is selected, load matching SOPs and glossary terms.
  let sopResults: SopResult[] = [];
  let glossaryResults: GlossaryResult[] = [];

  if (tagId) {
    const [sopTagRows, glossaryTagRows] = await Promise.all([
      supabase.from("sop_tags").select("sop_id").eq("tag_id", tagId),
      supabase.from("glossary_term_tags").select("term_id").eq("tag_id", tagId),
    ]);

    const taggedSopIds = (sopTagRows.data ?? []).map((r: { sop_id: string }) => r.sop_id);
    const taggedTermIds = (glossaryTagRows.data ?? []).map((r: { term_id: string }) => r.term_id);

    if (taggedSopIds.length > 0) {
      let sopQuery = supabase
        .from("sops")
        .select("id, title, departments(id, name)")
        .eq("company_id", company_id)
        .eq("status", "published")
        .in("id", taggedSopIds)
        .order("title", { ascending: true });

      if (deptIds.length > 0) {
        sopQuery = sopQuery.or(
          `department_id.is.null,department_id.in.(${deptIds.join(",")})`,
        );
      }

      const { data: sops } = await sopQuery;
      sopResults = (sops ?? []) as unknown as SopResult[];
    }

    if (taggedTermIds.length > 0) {
      const { data: terms } = await supabase
        .from("glossary_terms")
        .select("id, term_en, term_es, definition_en, definition_es")
        .eq("company_id", company_id)
        .is("deleted_at", null)
        .in("id", taggedTermIds)
        .order("term_en", { ascending: true });
      glossaryResults = (terms ?? []) as GlossaryResult[];
    }
  }

  const clearHref = lang !== persisted ? `/app/search?lang=${lang}` : "/app/search";

  function tagHref(tag: Tag): string {
    const params = new URLSearchParams();
    if (lang !== persisted) params.set("lang", lang);
    if (tagId !== tag.id) params.set("tag", tag.id);
    const qs = params.toString();
    return `/app/search${qs ? `?${qs}` : ""}`;
  }

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
        <LanguageToggle current={lang} />
      </header>

      {/* Disabled text search — full-text search coming later */}
      <div className="mb-6 flex items-center gap-2 rounded-xl border border-dc-edge bg-dc-surface px-4 py-3">
        <Search className="size-4 shrink-0 text-dc-text-3" strokeWidth={2} aria-hidden />
        <input
          type="search"
          placeholder={t.searchPlaceholder}
          disabled
          className="min-h-[44px] w-full bg-transparent text-base text-dc-text placeholder:text-dc-text-3 focus:outline-none disabled:cursor-not-allowed"
        />
      </div>

      {/* Label filter bar */}
      {allTags.length > 0 && (
        <section className="mb-6" aria-labelledby="labels-heading">
          <h2
            id="labels-heading"
            className="mb-3 text-xs font-semibold tracking-[0.12em] text-dc-text-3 uppercase"
          >
            {t.labelsHeading}
          </h2>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t.labelsHeading}>
            {allTags.map((tag) => {
              const isActive = tagId === tag.id;
              return (
                <Link
                  key={tag.id}
                  href={tagHref(tag)}
                  aria-pressed={isActive}
                  className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-transparent text-white shadow-sm"
                      : "border-dc-edge bg-dc-surface text-dc-text-2 hover:border-(--color-brand)/40 hover:text-dc-text"
                  }`}
                  style={isActive ? { backgroundColor: tag.color } : undefined}
                >
                  <span
                    className={`size-2.5 rounded-full shrink-0 ${isActive ? "bg-white/70" : ""}`}
                    style={!isActive ? { backgroundColor: tag.color } : undefined}
                    aria-hidden
                  />
                  <span>{lang === "es" ? tag.name_es : tag.name_en}</span>
                </Link>
              );
            })}
          </div>
          {tagId && (
            <Link
              href={clearHref}
              className="mt-2 inline-block text-xs text-dc-text-3 underline-offset-2 hover:text-dc-text hover:underline"
            >
              {t.clearFilter}
            </Link>
          )}
        </section>
      )}

      {/* Results when a tag is selected */}
      {tagId ? (
        <div className="flex flex-col gap-8">
          {/* SOPs */}
          <section aria-labelledby="procedures-heading">
            <h2
              id="procedures-heading"
              className="mb-3 text-xs font-semibold tracking-[0.12em] text-dc-text-3 uppercase"
            >
              {t.proceduresHeading}
            </h2>
            {sopResults.length === 0 ? (
              <div className="rounded-xl border border-dashed border-dc-edge bg-dc-surface px-5 py-8 text-center">
                <FileText className="mx-auto size-5 text-dc-text-3" strokeWidth={1.75} aria-hidden />
                <p className="mt-2 text-sm text-dc-text-2">{t.noResults}</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {sopResults.map((sop) => (
                  <li key={sop.id}>
                    <Link
                      href={`/app/sop/${sop.id}`}
                      className="flex min-h-[64px] items-center gap-4 rounded-xl border border-dc-edge bg-dc-surface px-4 py-3 transition-colors hover:bg-dc-raised active:scale-[0.99]"
                    >
                      <span
                        aria-hidden
                        className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-(--color-brand)/10 text-(--color-brand)"
                      >
                        <FileText className="size-5" strokeWidth={1.75} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-dc-text">{sop.title}</p>
                        {sop.departments && (
                          <p className="mt-0.5 text-xs text-dc-text-3" lang="en">
                            {sop.departments.name}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Glossary terms */}
          <section aria-labelledby="glossary-heading">
            <h2
              id="glossary-heading"
              className="mb-3 text-xs font-semibold tracking-[0.12em] text-dc-text-3 uppercase"
            >
              {t.glossaryHeading}
            </h2>
            {glossaryResults.length === 0 ? (
              <div className="rounded-xl border border-dashed border-dc-edge bg-dc-surface px-5 py-8 text-center">
                <BookOpenText className="mx-auto size-5 text-dc-text-3" strokeWidth={1.75} aria-hidden />
                <p className="mt-2 text-sm text-dc-text-2">{t.noGlossaryResults}</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {glossaryResults.map((term) => {
                  const displayTerm = lang === "es" ? term.term_es : term.term_en;
                  const displayDef = lang === "es" ? term.definition_es : term.definition_en;
                  return (
                    <li key={term.id}>
                      <div
                        lang={lang}
                        className="rounded-xl border border-dc-edge bg-dc-surface px-4 py-3"
                      >
                        <p className="font-medium text-dc-text">{displayTerm}</p>
                        {displayDef && (
                          <p className="mt-1 text-sm text-dc-text-2">{displayDef}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      ) : (
        allTags.length > 0 ? (
          <div className="rounded-xl border border-dashed border-dc-edge bg-dc-surface px-5 py-10 text-center">
            <p className="text-sm text-dc-text-2">{t.selectLabel}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-dc-edge bg-dc-surface px-5 py-10 text-center">
            <FileText className="mx-auto size-6 text-dc-text-3" strokeWidth={2} aria-hidden />
            <p className="mt-2 text-sm text-dc-text-2">{t.searchDisabled}</p>
          </div>
        )
      )}
    </main>
  );
}
