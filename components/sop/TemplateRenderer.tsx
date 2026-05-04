import type { SopTemplate } from "@/lib/types/sop";
import { renderMarkdown } from "@/lib/sop/markdown";
import { StepByStepRenderer } from "./StepByStepRenderer";
import { ReferenceRenderer } from "./ReferenceRenderer";
import { SafetyChecklistRenderer } from "./SafetyChecklistRenderer";
import { OnboardingRenderer } from "./OnboardingRenderer";

interface Props {
  content: string;
  template: SopTemplate | null;
  lang?: string;
}

/**
 * Dispatches to the correct template renderer based on `sops.template`.
 * Falls back to plain renderMarkdown for null (legacy SOPs without a
 * template set) so the worker reader never shows an empty screen.
 */
export function TemplateRenderer({ content, template, lang }: Props) {
  switch (template) {
    case "step-by-step":
      return <StepByStepRenderer content={content} lang={lang} />;
    case "reference":
      return <ReferenceRenderer content={content} lang={lang} />;
    case "safety-checklist":
      return <SafetyChecklistRenderer content={content} lang={lang} />;
    case "onboarding":
      return <OnboardingRenderer content={content} lang={lang} />;
    default:
      return <>{renderMarkdown(content, { className: "max-w-none" })}</>;
  }
}
