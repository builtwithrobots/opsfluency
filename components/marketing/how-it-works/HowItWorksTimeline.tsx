// v1.0.0
// Timeline: upload to mounted QR in under 15 minutes. Horizontal at
// md+ (dots + connecting line + time chips), stacked list on mobile.

import {
  CheckCircle2,
  FileText,
  Languages,
  Printer,
  Sparkles,
  Upload,
} from "lucide-react";
import type { ReactNode } from "react";

import { Container } from "@/components/marketing/Container";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { MotionSection } from "@/components/motion/MotionSection";

type Stage = { label: string; minutes: number; icon: ReactNode };

const STAGES: Stage[] = [
  { label: "Upload", minutes: 2, icon: <Upload className="h-4 w-4" strokeWidth={2} /> },
  { label: "AI converts", minutes: 3, icon: <Sparkles className="h-4 w-4" strokeWidth={2} /> },
  { label: "Define terms", minutes: 3, icon: <FileText className="h-4 w-4" strokeWidth={2} /> },
  { label: "Translate", minutes: 3, icon: <Languages className="h-4 w-4" strokeWidth={2} /> },
  { label: "Approve", minutes: 2, icon: <CheckCircle2 className="h-4 w-4" strokeWidth={2} /> },
  { label: "Print", minutes: 2, icon: <Printer className="h-4 w-4" strokeWidth={2} /> },
];

const TOTAL_MINUTES = STAGES.reduce((sum, stage) => sum + stage.minutes, 0);
const HEADING_ID = "hiw-timeline-heading";

function TimeChip({ minutes }: { minutes: number }) {
  return (
    <span
      className="inline-flex h-5 items-center rounded-full border border-[color-mix(in_srgb,var(--color-brand)_25%,transparent)] bg-[color-mix(in_srgb,var(--color-brand)_12%,transparent)] px-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-brand)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {minutes} min
    </span>
  );
}

export function HowItWorksTimeline() {
  return (
    <MotionSection
      aria-labelledby={HEADING_ID}
      className="py-16 md:py-24"
    >
      <Container className="flex flex-col gap-10">
        <SectionHeader
          id={HEADING_ID}
          eyebrow="Elapsed time"
          heading={`Upload to mounted QR in ${TOTAL_MINUTES} minutes.`}
          subhead="Measured on a first-time manager with no prior onboarding. Repeat SOPs are faster because the glossary compounds."
        />

        {/* Horizontal timeline (md+) */}
        <ol
          className="relative hidden items-start justify-between gap-4 md:flex"
          aria-label="Stages with time estimates"
        >
          <div
            aria-hidden="true"
            className="absolute left-6 right-6 top-5 h-px bg-dc-edge"
          />
          {STAGES.map((stage) => (
            <li
              key={stage.label}
              className="relative flex flex-1 flex-col items-center gap-3"
            >
              <span
                aria-hidden="true"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-brand)] bg-dc-surface text-[var(--color-brand)]"
              >
                {stage.icon}
              </span>
              <span
                className="text-sm font-semibold text-dc-text"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {stage.label}
              </span>
              <TimeChip minutes={stage.minutes} />
            </li>
          ))}
        </ol>

        {/* Stacked list (mobile) */}
        <ol
          className="flex flex-col gap-3 md:hidden"
          aria-label="Stages with time estimates"
        >
          {STAGES.map((stage) => (
            <li
              key={stage.label}
              className="flex items-center gap-3 rounded-md border border-dc-edge bg-dc-surface px-3 py-3"
            >
              <span
                aria-hidden="true"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--color-brand)_12%,transparent)] text-[var(--color-brand)]"
              >
                {stage.icon}
              </span>
              <span
                className="flex-1 text-sm font-semibold text-dc-text"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {stage.label}
              </span>
              <TimeChip minutes={stage.minutes} />
            </li>
          ))}
        </ol>

        <p className="text-center text-sm text-dc-text-2">
          Under the {TOTAL_MINUTES}-minute mark, every time. The worker end of the flow is three taps and takes thirty seconds.
        </p>
      </Container>
    </MotionSection>
  );
}
