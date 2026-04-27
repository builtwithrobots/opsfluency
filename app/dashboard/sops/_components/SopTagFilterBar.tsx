import Link from "next/link";

import type { Tag } from "@/lib/types/tags";

interface Props {
  allTags: Tag[];
  activeTagId: string | null;
  q: string;
  status: string;
}

function buildHref(
  tagId: string | null,
  q: string,
  status: string,
): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status !== "all") params.set("status", status);
  if (tagId) params.set("tag", tagId);
  const qs = params.toString();
  return `/dashboard/sops${qs ? `?${qs}` : ""}`;
}

/**
 * URL-driven label filter bar for the SOP list.
 */
export function SopTagFilterBar({ allTags, activeTagId, q, status }: Props) {
  const clearHref = buildHref(null, q, status);

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by label">
      <span className="text-xs font-medium text-dc-text-3">Labels:</span>

      {allTags.map((tag) => {
        const isActive = activeTagId === tag.id;
        const href = isActive ? clearHref : buildHref(tag.id, q, status);

        return (
          <Link
            key={tag.id}
            href={href}
            aria-pressed={isActive}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              isActive
                ? "border-transparent text-white"
                : "border-[color:var(--dc-edge)] bg-dc-surface text-dc-text-2 hover:border-(--color-brand)/40 hover:text-dc-text"
            }`}
            style={isActive ? { backgroundColor: tag.color, borderColor: tag.color } : undefined}
          >
            <span
              className={`size-2 rounded-full shrink-0 ${isActive ? "bg-white/60" : ""}`}
              style={!isActive ? { backgroundColor: tag.color } : undefined}
              aria-hidden
            />
            <span lang="en">{tag.name_en}</span>
          </Link>
        );
      })}

      {activeTagId && (
        <Link
          href={clearHref}
          className="text-xs text-dc-text-3 underline-offset-2 hover:text-dc-text hover:underline"
        >
          Clear filter
        </Link>
      )}
    </div>
  );
}
