import { renderMarkdown } from "@/lib/sop/markdown";

interface Props {
  content: string;
  lang?: string;
}

/**
 * Step-by-step template renderer.
 *
 * Wraps the rendered Markdown in `.sop-steps` (see app/globals.css). Each
 * `<li>` of the top-level `<ol>` becomes a numbered circle + content row,
 * with a thin brand-colored vertical rail connecting consecutive steps —
 * the procedure visually reads as a sequence, not a paragraph stack.
 * Nested ordered lists fall back to default decimal styling.
 */
export function StepByStepRenderer({ content, lang }: Props) {
  return (
    <div lang={lang} className="sop-steps">
      {renderMarkdown(content, { className: "max-w-none" })}
    </div>
  );
}
