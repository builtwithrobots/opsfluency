import { BookOpenText, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getCompanyContext } from "@/lib/auth/company-context";
import type { GlossaryTermWithTags } from "@/lib/types/glossary";
import type { Tag } from "@/lib/types/tags";

import { AddTermButtonClient } from "./_components/AddTermButtonClient";
import { GlossaryListClient } from "./_components/GlossaryListClient";
import { GlossarySearchForm } from "./_components/GlossarySearchForm";
import { GlossaryViewTabs } from "./_components/GlossaryViewTabs";
import { TagFilterBar } from "./_components/TagFilterBar";

type View = "active" | "archived";

interface PageProps {
  searchParams: Promise<{ q?: string; view?: string; tag?: string }>;
}

function resolveView(raw: string | undefined): View {
  return raw === "archived" ? "archived" : "active";
}

async function loadTermsWithTags(
  supabase: Awaited<ReturnType<typeof getCompanyContext>>["supabase"],
  company_id: string,
  view: View,
  q: string,
  tagId: string | null,
): Promise<GlossaryTermWithTags[]> {
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

  if (tagId) {
    const { data: taggedRows } = await supabase
      .from("glossary_term_tags")
      .select("term_id")
      .eq("tag_id", tagId);
    const ids = (taggedRows ?? []).map((r: { term_id: string }) => r.term_id);
    if (ids.length === 0) return [];
    query = query.in("id", ids);
  }

  const { data, error } = await query.order("term_en", { ascending: true });
  if (error) throw error;

  const terms = data ?? [];
  if (terms.length === 0) return [];

  // Fetch tag assignments for the returned terms.
  const termIds = terms.map((t: { id: string }) => t.id);
  const { data: assignments } = await supabase
    .from("glossary_term_tags")
    .select("term_id, tags(*)")
    .in("term_id", termIds);

  const tagsByTermId = new Map<string, Tag[]>();
  for (const row of assignments ?? []) {
    const r = row as unknown as { term_id: string; tags: Tag };
    if (!tagsByTermId.has(r.term_id)) tagsByTermId.set(r.term_id, []);
    tagsByTermId.get(r.term_id)!.push(r.tags);
  }

  return terms.map((t: { id: string }) => ({
    ...(t as object),
    tags: tagsByTermId.get((t as { id: string }).id) ?? [],
  })) as GlossaryTermWithTags[];
}

async function loadCompanyTags(
  supabase: Awaited<ReturnType<typeof getCompanyContext>>["supabase"],
  company_id: string,
): Promise<Tag[]> {
  const { data } = await supabase
    .from("tags")
    .select("*")
    .eq("company_id", company_id)
    .order("source", { ascending: false })
    .order("name_en", { ascending: true });
  return (data ?? []) as Tag[];
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
  const { q: rawQ, view: rawView, tag: rawTag } = await searchParams;
  const view = resolveView(rawView);
  const q = (rawQ ?? "").trim();
  const tagId = rawTag ?? null;

  const { supabase, company_id } = await getCompanyContext("manager");
  const [terms, allTags, counts] = await Promise.all([
    loadTermsWithTags(supabase, company_id, view, q, tagId),
    loadCompanyTags(supabase, company_id),
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

          {allTags.length > 0 && (
            <TagFilterBar allTags={allTags} activeTagId={tagId} view={view} q={q} />
          )}

          <GlossaryListClient view={view} terms={terms} query={q} allTags={allTags} />
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
