import Link from "next/link";

interface Props {
  view: "active" | "archived";
  counts: { active: number; archived: number };
  q: string;
}

/**
 * Active / Archived tab pair, expressed as Link tags so the URL is the
 * single source of truth and the page can be deep-linked. Server
 * component — no state.
 */
export function GlossaryViewTabs({ view, counts, q }: Props) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);

  function href(target: "active" | "archived") {
    const next = new URLSearchParams(params);
    if (target === "archived") next.set("view", "archived");
    const qs = next.toString();
    return qs ? `/dashboard/glossary?${qs}` : "/dashboard/glossary";
  }

  return (
    <nav aria-label="Glossary view" className="flex items-center gap-1">
      <TabLink href={href("active")} active={view === "active"} count={counts.active}>
        Active
      </TabLink>
      <TabLink href={href("archived")} active={view === "archived"} count={counts.archived}>
        Archived
      </TabLink>
    </nav>
  );
}

function TabLink({
  href,
  active,
  count,
  children,
}: {
  href: string;
  active: boolean;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-(--color-brand)/10 text-(--color-brand)"
          : "text-dc-text-2 hover:bg-dc-overlay hover:text-dc-text",
      ].join(" ")}
    >
      <span>{children}</span>
      <span
        className={[
          "rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums",
          active ? "bg-(--color-brand)/15 text-(--color-brand)" : "bg-dc-overlay text-dc-text-3",
        ].join(" ")}
      >
        {count}
      </span>
    </Link>
  );
}
