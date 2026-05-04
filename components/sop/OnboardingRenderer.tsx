import { renderMarkdown } from "@/lib/sop/markdown";

interface Props {
  content: string;
  lang?: string;
}

/**
 * Onboarding template renderer.
 * A welcoming header sets a warmer tone than other templates. The content
 * itself renders identically to the standard renderer — the framing is
 * what signals "this is for someone new, take your time."
 */
export function OnboardingRenderer({ content, lang }: Props) {
  return (
    <div lang={lang}>
      {/* Welcome banner */}
      <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
            <svg
              className="size-5 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-400">Welcome guide</p>
            <p className="mt-0.5 text-xs text-dc-text-2">
              Take your time. Ask your manager if anything is unclear.
            </p>
          </div>
        </div>
      </div>

      {renderMarkdown(content, { className: "max-w-none" })}
    </div>
  );
}
