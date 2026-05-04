import { renderMarkdown } from "@/lib/sop/markdown";

interface Props {
  content: string;
  lang?: string;
}

interface TocItem {
  level: 2 | 3;
  text: string;
  slug: string;
}

function extractToc(markdown: string): TocItem[] {
  const headingRe = /^(#{2,3})\s+(.+)$/gm;
  const items: TocItem[] = [];
  let match: RegExpExecArray | null;

  while ((match = headingRe.exec(markdown)) !== null) {
    const level = match[1].length as 2 | 3;
    const text = match[2].trim();
    const slug = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    items.push({ level, text, slug });
  }

  return items;
}

/**
 * Reference template renderer.
 * Adds an auto-generated table of contents above the content so workers
 * can jump directly to the section they need without scrolling.
 */
export function ReferenceRenderer({ content, lang }: Props) {
  const toc = extractToc(content);

  return (
    <div lang={lang}>
      {/* Template badge */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-7 items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/8 px-3">
          <svg className="size-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
          </svg>
          <span className="text-xs font-semibold tracking-wide text-sky-400 uppercase">Reference</span>
        </div>
      </div>

      {/* Table of contents */}
      {toc.length >= 2 && (
        <nav
          aria-label="Contents"
          className="mb-6 rounded-xl border border-[color:var(--dc-edge)] bg-dc-raised p-4"
        >
          <p className="mb-3 text-xs font-semibold tracking-widest text-dc-text-3 uppercase">
            Contents
          </p>
          <ol className="space-y-1.5">
            {toc.map((item, i) => (
              <li
                key={`${item.slug}-${i}`}
                className={item.level === 3 ? "pl-4" : ""}
              >
                <a
                  href={`#${item.slug}`}
                  className="text-sm text-dc-text-2 hover:text-dc-text transition-colors"
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {renderMarkdown(content, { className: "max-w-none" })}
    </div>
  );
}
