import { BookOpenText, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getCompanyContext } from "@/lib/auth/company-context";
import type { GlossaryTerm } from "@/lib/types/glossary";

import { AddTermButtonClient } from "./_components/AddTermButtonClient";
import { GlossaryListClient } from "./_components/GlossaryListClient";
import { GlossarySearchForm } from "./_components/GlossarySearchForm";
import { GlossaryViewTabs } from "./_components/GlossaryViewTabs";

type View = "active" | "archived";

interface PageProps {
  searchParams: Promise<{ q?: string; view?: string }>;
}

function resolveView(raw: string | undefined): View {
  return raw === "archived" ? "archived" : "active";
}

async function loadTerms(
  supabase: Awaited<ReturnType<typeof getCompanyContext>>["supabase"],
  company_id: string,
  view: View,
  q: string,
): Promise<GlossaryTerm[]> {
  let query = supabase
    .from("glossary_terms")
    .select(
      "id, company_id, term_en, definition_en, term_es, definition_es, created_by, created_at, updated_at, deleted_at",
    )
    .eq("company_id", company_id);

  query =
    view === "archived" ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);

  if (q) {
    const escaped = q.replace(/[%_]/g, (c) => `\\${c}`);
    query = query.or(
      `term_en.ilike.%${escaped}%,term_es.ilike.%${escaped}%,definition_en.ilike.%${escaped}%,definition_es.ilike.%${escaped}%`,
    );
  }

  const { data, error } = await query.order("term_en", { ascending: true });
  if (error) throw error;
  return (data ?? []) as GlossaryTerm[];
}

async function countByView(
  supabase: Awaited<ReturnType<typeof getCompanyContext>>["supabase"],
  company_id: string,
): Promise<{ active: number; archived: number }> {
  const [{ count: active }, { count: archived }] = await Promise.all([
    supabase
      .from("glossary_terms")
      .select("id", { count: "exact", head: true })
      .eq("company_id", company_id)
      .is("deleted_at", null),
    supabase
      .from("glossary_terms")
      .select("id", { count: "exact", head: true })
      .eq("company_id", company_id)
      .not("deleted_at", "is", null),
  ]);
  return { active: active ?? 0, archived: archived ?? 0 };
}

export default async function GlossaryPage({ searchParams }: PageProps) {
  const { q: rawQ, view: rawView } = await searchParams;
  const view = resolveView(rawView);
  const q = (rawQ ?? "").trim();

  const { supabase, company_id } = await getCompanyContext("manager");
  const [terms, counts] = await Promise.all([
    loadTerms(supabase, company_id, view, q),
    countByView(supabase, company_id),
  ]);

  const hasAnyTerm = counts.active + counts.archived > 0;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs font-medium tracking-[0.15em] text-(--color-brand) uppercase">
          Manager
        </p>
        <Heading className="font-display mt-2">Glossary</Heading>
        <Text className="mt-2 max-w-2xl">
          Bilingual terms used across every translated SOP. New terms arrive automatically
          when you import an SOP and define the terms Sonnet flags. Edits here flow into
          every future translation.
        </Text>
      </header>

      {hasAnyTerm ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <GlossaryViewTabs view={view} counts={counts} q={q} />
            <div className="flex items-center gap-2">
              <GlossarySearchForm defaultValue={q} view={view} />
              <AddTermButtonClient />
            </div>
          </div>
          <GlossaryListClient view={view} terms={terms} query={q} />
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <section
      className="rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-6 py-12 text-center"
      aria-labelledby="glossary-empty-heading"
    >
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-(--color-brand)/10 text-(--color-brand)">
        <BookOpenText className="size-6" strokeWidth={1.5} aria-hidden />
      </div>
      <Heading
        level={2}
        id="glossary-empty-heading"
        className="font-display mt-4 text-xl"
      >
        Your glossary is empty
      </Heading>
      <Text className="mx-auto mt-2 max-w-md text-sm">
        Most teams build their glossary by importing SOPs — Sonnet flags site-specific terms,
        you confirm them once, and they live here forever. You can also add terms by hand.
      </Text>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button color="brand" href="/dashboard/sops">
          <FileText data-slot="icon" strokeWidth={2} />
          Import an SOP
        </Button>
        <AddTermButtonClient variant="outline" />
      </div>
    </section>
  );
}
