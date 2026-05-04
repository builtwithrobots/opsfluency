import { renderMarkdown } from "@/lib/sop/markdown";

interface Props {
  content: string;
  lang?: string;
}

/**
 * Step-by-step template renderer.
 * Accents sequential flow: a numbered-step indicator header, a brand-colored
 * left border on the content column, and the existing markdown renderer
 * which already produces well-styled ordered lists and callout blockquotes.
 */
export function StepByStepRenderer({ content, lang }: Props) {
  return (
    <div lang={lang}>
      {/* Template badge */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-7 items-center gap-1.5 rounded-full border border-(--color-brand)/30 bg-(--color-brand)/8 px-3">
          <span className="flex size-4 items-center justify-center rounded-full bg-(--color-brand) text-[10px] font-bold text-white leading-none">1</span>
          <span className="text-xs font-semibold tracking-wide text-(--color-brand) uppercase">Step-by-step</span>
        </div>
      </div>

      {/* Content with brand left-border accent */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-(--color-brand)/20" />
        <div className="pl-5">
          {renderMarkdown(content, { className: "max-w-none" })}
        </div>
      </div>
    </div>
  );
}
