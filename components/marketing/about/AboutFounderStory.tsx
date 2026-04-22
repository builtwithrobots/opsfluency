// v1.0.0
// Founder story. Long-form prose with three oversized pull-quote beats
// per the About override. All prose is text-lg leading-relaxed.

import { Container } from "@/components/marketing/Container";
import { MotionSection } from "@/components/motion/MotionSection";

const HEADING_ID = "about-story-heading";

function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote
      className="my-6 border-l-2 border-[var(--color-brand)] pl-6 text-3xl font-medium leading-snug text-dc-text md:text-4xl"
      style={{ fontFamily: "var(--font-display)" }}
    >
      {children}
    </blockquote>
  );
}

export function AboutFounderStory() {
  return (
    <MotionSection
      aria-labelledby={HEADING_ID}
      className="py-12 md:py-16"
    >
      <Container width="prose" className="flex flex-col gap-6">
        <span
          className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          The story
        </span>
        <h2
          id={HEADING_ID}
          className="text-3xl font-semibold tracking-tight text-dc-text md:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Twenty years in operations. One obvious problem nobody was solving.
        </h2>
        <p className="text-lg leading-relaxed text-dc-text-2">
          I spent my career running warehouses, distribution centers, and manufacturing floors. Good teams. Good people. Good procedures, mostly. And every single site had the same problem: the non-English-speaking half of the workforce was running on guesswork, pattern-matching, and the patience of whoever sat next to them.
        </p>
        <p className="text-lg leading-relaxed text-dc-text-2">
          On day one a new hire got an English onboarding binder and a thirty-minute tour. They nodded through all of it. By day three they were making small mistakes nobody wanted to flag, because flagging a mistake meant admitting they had not understood the training. By week eight, most of them were gone. And when they left, every exit survey blamed pay.
        </p>

        <PullQuote>
          Workers do not quit for fifty cents more per hour. They quit because they are frustrated and embarrassed.
        </PullQuote>

        <p className="text-lg leading-relaxed text-dc-text-2">
          I watched this happen year after year. The HR team would roll out a new retention program. Management would approve a new pay band. Recruiting would promise a new pipeline. None of it worked, because none of it addressed the actual problem: the worker could not read the procedure, and asking for help felt like asking to be demoted.
        </p>
        <p className="text-lg leading-relaxed text-dc-text-2">
          Meanwhile, the tools that should have existed did not. We had learning management systems built for corporate compliance, not for someone in a safety vest with one free hand. We had translation plugins that mangled every site-specific term. We had QR-code labeler software and SOP authoring software and none of them talked to each other.
        </p>

        <PullQuote>
          The tools that should have existed for frontline teams did not exist. So I stopped waiting.
        </PullQuote>

        <p className="text-lg leading-relaxed text-dc-text-2">
          OpsFluency is what I wished I had for twenty years. Upload a doc, get clean bilingual SOPs, print one permanent QR, mount it where the work happens. Workers scan, read, and get on with the job. Managers post announcements, pair monitors, and reach HR without filing a ticket. It is deliberately boring. It does the thing you already know you need.
        </p>

        <PullQuote>
          This is operations infrastructure, not a translation tool. The difference is the whole product.
        </PullQuote>

        <p className="text-lg leading-relaxed text-dc-text-2">
          I built this for the squeezed middle manager who needs a win next shift, not a committee-approved rollout plan for next quarter. If that is you, we should talk.
        </p>
      </Container>
    </MotionSection>
  );
}
