import { Search } from "lucide-react";

interface Props {
  defaultValue: string;
  view: "active" | "archived";
}

/**
 * Plain GET form — Next App Router treats the query string as
 * `searchParams`, so the page re-renders with the filtered list on
 * submit with no JavaScript needed.
 */
export function GlossarySearchForm({ defaultValue, view }: Props) {
  return (
    <form
      method="get"
      action="/dashboard/glossary"
      className="flex items-center gap-2"
      role="search"
    >
      {view === "archived" && <input type="hidden" name="view" value="archived" />}
      <label htmlFor="glossary-search" className="sr-only">
        Search glossary
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-dc-text-3"
          strokeWidth={1.75}
          aria-hidden
        />
        <input
          id="glossary-search"
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder="Search terms or definitions…"
          className="w-64 rounded-md border border-[color:var(--dc-edge)] bg-dc-raised py-2 pr-3 pl-9 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
        />
      </div>
    </form>
  );
}
