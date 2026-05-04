import { renderMarkdown } from "@/lib/sop/markdown";

interface Props {
  content: string;
  lang?: string;
}

/**
 * Safety checklist template renderer.
 * Prominent safety header with hazard coloring, then the standard Markdown
 * renderer — which already styles `- [ ]` task list items and `> Warning:`
 * blockquotes. The template-level framing reinforces the safety-critical
 * nature of the document so workers treat it accordingly.
 */
export function SafetyChecklistRenderer({ content, lang }: Props) {
  return (
    <div lang={lang}>
      {/* Safety header band */}
      <div className="mb-5 flex items-center gap-3 rounded-xl border border-(--color-signal-urgent)/30 bg-(--color-signal-urgent)/5 px-4 py-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-(--color-signal-urgent)/15">
          {/* Hazard triangle */}
          <svg
            className="size-5 text-(--color-signal-urgent)"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-(--color-signal-urgent) uppercase tracking-wide">
            Safety checklist
          </p>
          <p className="mt-0.5 text-xs text-dc-text-2">
            Complete every item before proceeding. Do not skip steps.
          </p>
        </div>
      </div>

      {renderMarkdown(content, { className: "max-w-none" })}
    </div>
  );
}
