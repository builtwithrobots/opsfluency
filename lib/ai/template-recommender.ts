import "server-only";

import { HAIKU_MODEL, callSonnet, type SonnetCallContext } from "./sonnet";
import type { SopTemplate } from "@/lib/types/sop";

export interface TemplateRecommendation {
  recommended: SopTemplate;
  confidence: "high" | "medium" | "low";
  reason: string;
}

const VALID_TEMPLATES: SopTemplate[] = [
  "step-by-step",
  "reference",
  "safety-checklist",
  "onboarding",
];

const SYSTEM_PROMPT = `You are an expert at classifying Standard Operating Procedures for OpsFluency, a bilingual SOP platform for warehouse and manufacturing workers.

Analyze the structure and content of a converted SOP Markdown document and recommend the best display template from exactly these four options:

- "step-by-step": For procedures with sequential numbered steps, machine operation, or processes where order matters. Signs: many ordered list items (≥5), time-ordered workflow, warning callouts between steps.
- "reference": For lookup documents, specifications, or policy docs. Signs: many section headings (≥4 H2/H3), tables, dense cross-references, not primarily a sequence of actions.
- "safety-checklist": For pre-shift checks, compliance audits, or inspection lists. Signs: checkbox items (- [ ]), repeated warnings/cautions, safety-critical keywords (PPE, hazard, lockout, OSHA), inspection format.
- "onboarding": For new hire guides, role introductions, or orientation materials. Signs: welcoming tone, "welcome"/"introduction"/"getting started" language, contact information, lighter reading level.

Output JSON ONLY in exactly this shape, no Markdown fences, no commentary:
{"recommended":"string — one of the four template keys","confidence":"high|medium|low","reason":"string — one short sentence explaining the key signals that led to this recommendation, e.g. '12 numbered steps and 2 warning callouts detected'"}

If signals are mixed or ambiguous, output "medium" confidence and pick the best fit. Never output a template key not in the list above.`;

function parseRecommendation(rawText: string): TemplateRecommendation {
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  const parsed = JSON.parse(cleaned) as unknown;
  if (typeof parsed !== "object" || parsed === null) throw new Error("Not an object");

  const obj = parsed as Record<string, unknown>;
  if (
    typeof obj.recommended !== "string" ||
    !VALID_TEMPLATES.includes(obj.recommended as SopTemplate)
  ) throw new Error("Invalid recommended template");

  const confidence = obj.confidence === "high" || obj.confidence === "medium" || obj.confidence === "low"
    ? obj.confidence
    : "medium";

  return {
    recommended: obj.recommended as SopTemplate,
    confidence,
    reason: typeof obj.reason === "string" ? obj.reason.slice(0, 300) : "Document structure analyzed.",
  };
}

/**
 * Calls Haiku to infer the best display template for a converted SOP Markdown.
 * Runs in parallel with DB writes in runConversion — adds no latency to the
 * manager-facing flow. Returns null on any failure (recommendation is optional;
 * conversion must not fail because of it).
 */
export async function recommendTemplate(
  markdown: string,
  ctx: SonnetCallContext,
): Promise<TemplateRecommendation | null> {
  // Truncate to first 6 000 chars — template signals appear in structure,
  // not in the details. Keeps this call cheap and fast.
  const sample = markdown.length > 6_000 ? markdown.slice(0, 6_000) + "\n\n[document continues…]" : markdown;

  const result = await callSonnet<TemplateRecommendation>(
    {
      model: HAIKU_MODEL,
      systemPrompt: SYSTEM_PROMPT,
      userMessage: `Analyze this SOP Markdown and recommend the best display template:\n\n---BEGIN MARKDOWN---\n${sample}\n---END MARKDOWN---`,
      maxTokens: 256,
      parse: parseRecommendation,
    },
    ctx,
  );

  if (!result.ok) return null;
  return result.data;
}
