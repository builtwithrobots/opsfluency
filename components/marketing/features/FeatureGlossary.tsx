// v1.0.0
// Features section 02: company glossary. Mockup shows a table of
// site-specific terms mapped English to Spanish with status pills.

import { BookOpen } from "lucide-react";

import { FeatureDetailRow } from "./FeatureDetailRow";

type GlossaryRow = {
  en: string;
  es: string;
  status: "defined" | "flagged";
};

const ROWS: GlossaryRow[] = [
  { en: "Dock door 7", es: "Puerta de muelle 7", status: "defined" },
  { en: "Roller cage", es: "Jaula rodante", status: "defined" },
  { en: "PIT cert", es: "Cert. montacargas", status: "defined" },
  { en: "PPE bin", es: "Contenedor EPP", status: "flagged" },
];

export function FeatureGlossary() {
  return (
    <FeatureDetailRow
      id="glossary"
      headingId="features-glossary-heading"
      side="left"
      eyebrow="02 - Company glossary"
      icon={<BookOpen className="h-5 w-5" strokeWidth={2} />}
      title="Define site-specific terms once. They translate correctly forever."
      description="Every warehouse has terms generic translators mangle. Dock door 7, PIT cert, the particular name you give a station. The glossary catches them on import and holds you to the translation you approved, across every future SOP."
      bullets={[
        "AI flags terms it isn't sure about instead of guessing.",
        "Injected into every translation call so Spanish stays consistent.",
        "Shared across your whole team and every new SOP.",
      ]}
      mockupLabel="glossary table mapping English terms to Spanish with status pills"
      mockup={
        <div className="mt-10 flex flex-col gap-2">
          <div
            className="grid grid-cols-[1fr_1fr_auto] gap-3 border-b border-dc-edge-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-dc-text-3"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <span>English</span>
            <span>Spanish</span>
            <span>Status</span>
          </div>
          {ROWS.map((row) => (
            <div
              key={row.en}
              className="grid grid-cols-[1fr_1fr_auto] items-center gap-3 rounded border border-dc-edge bg-dc-surface px-3 py-2 text-sm"
            >
              <span className="text-dc-text">{row.en}</span>
              <span className="text-dc-text-2">{row.es}</span>
              <span
                className={[
                  "inline-flex h-5 items-center rounded-full border px-2 text-[10px] font-semibold uppercase tracking-wider",
                  row.status === "defined"
                    ? "border-[color-mix(in_srgb,var(--color-signal-ok)_25%,transparent)] bg-[color-mix(in_srgb,var(--color-signal-ok)_12%,transparent)] text-[var(--color-signal-ok)]"
                    : "border-[color-mix(in_srgb,var(--color-signal-warn)_25%,transparent)] bg-[color-mix(in_srgb,var(--color-signal-warn)_12%,transparent)] text-[var(--color-signal-warn)]",
                ].join(" ")}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {row.status}
              </span>
            </div>
          ))}
        </div>
      }
    />
  );
}
