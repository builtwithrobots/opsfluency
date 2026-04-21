import Link from "next/link";
import type { ReactNode } from "react";

type Mode = "sign-in" | "sign-up";

interface AuthShellProps {
  mode: Mode;
  children: ReactNode;
}

const copy: Record<Mode, { eyebrow: string; title: string; lede: string; footerPrompt: string; footerCta: string; footerHref: string }> = {
  "sign-in": {
    eyebrow: "Welcome back",
    title: "Step back onto the floor.",
    lede: "Sign in to manage SOPs, publish announcements, and keep every shift on the same page — in English and Spanish.",
    footerPrompt: "New to OpsFluency?",
    footerCta: "Create an account",
    footerHref: "/sign-up",
  },
  "sign-up": {
    eyebrow: "Get started",
    title: "Turn every QR scan into competence.",
    lede: "Spin up your workspace in under a minute. We'll seed your Safety, Equipment, Process, and HR departments so you can publish your first bilingual SOP today.",
    footerPrompt: "Already have an account?",
    footerCta: "Sign in",
    footerHref: "/sign-in",
  },
};

const valueProps = [
  {
    title: "Bilingual by default",
    body: "English → Spanish on publish, glossary-locked so terminology never drifts.",
  },
  {
    title: "QR-triggered learning",
    body: "Scan a code, see the right SOP in the employee's language — instantly, offline-ready.",
  },
  {
    title: "Manager-driven, frontline-friendly",
    body: "Glove-friendly taps, 16px+ type, and warehouse-grade contrast. WCAG 2.1 AA.",
  },
];

export function AuthShell({ mode, children }: AuthShellProps) {
  const c = copy[mode];

  return (
    <main
      id="main"
      className="relative flex min-h-dvh flex-col bg-dc-bg lg:flex-row"
    >
      {/* Brand panel — left on desktop, top on mobile */}
      <section
        aria-label="OpsFluency"
        className="relative isolate flex flex-col justify-between overflow-hidden bg-[linear-gradient(135deg,#0C0E14_0%,#0F766E_100%)] px-6 py-10 text-white sm:px-10 lg:w-1/2 lg:px-16 lg:py-16"
      >
        {/* Subtle grid pattern */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 23px, #ffffff 23px, #ffffff 24px), repeating-linear-gradient(90deg, transparent, transparent 23px, #ffffff 23px, #ffffff 24px)",
          }}
        />
        {/* Teal glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[var(--color-brand)] opacity-25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-[var(--color-signal-live)] opacity-15 blur-3xl"
        />

        <Link
          href="/"
          className="relative z-10 inline-flex w-fit items-center gap-3 rounded-lg outline-offset-4"
          aria-label="OpsFluency home"
        >
          <span
            aria-hidden
            className="flex size-10 items-center justify-center rounded-lg bg-[var(--color-brand)] shadow-[0_0_18px_rgba(20,184,166,0.55)]"
          >
            <span className="font-display text-sm font-bold text-white">OF</span>
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            OpsFluency
          </span>
        </Link>

        <div className="relative z-10 flex flex-col gap-8 py-12 lg:py-0">
          <div className="flex flex-col gap-4">
            <span className="inline-block w-fit rounded-full border border-white/20 bg-white/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-white/80">
              {c.eyebrow}
            </span>
            <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {c.title}
            </h1>
            <p className="max-w-md text-base leading-relaxed text-white/80 sm:text-lg">
              {c.lede}
            </p>
          </div>

          <ul className="hidden max-w-md flex-col gap-5 lg:flex">
            {valueProps.map((v) => (
              <li key={v.title} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-1.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)]/20 ring-1 ring-[var(--color-brand)]/40"
                >
                  <span className="size-1.5 rounded-full bg-[var(--color-brand)]" />
                </span>
                <div>
                  <p className="font-display text-sm font-semibold tracking-wide text-white">
                    {v.title}
                  </p>
                  <p className="text-sm leading-relaxed text-white/70">
                    {v.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 hidden font-mono text-xs uppercase tracking-widest text-white/50 lg:block">
          &ldquo;Broadcasts become competence.&rdquo;
        </p>
      </section>

      {/* Form panel */}
      <section
        aria-label={mode === "sign-in" ? "Sign in" : "Sign up"}
        className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:px-16 lg:py-16"
      >
        <div className="flex w-full max-w-md flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-2xl font-bold tracking-tight text-dc-text sm:text-3xl">
              {mode === "sign-in" ? "Sign in to OpsFluency" : "Create your OpsFluency workspace"}
            </h2>
            <p className="text-sm leading-relaxed text-dc-text-2">
              {mode === "sign-in"
                ? "Use the magic link we emailed you, or your saved password."
                : "We'll email you a magic link to finish setup. No password required."}
            </p>
          </div>

          <div>{children}</div>

          <p className="text-center text-sm text-dc-text-2">
            {c.footerPrompt}{" "}
            <Link
              href={c.footerHref}
              className="font-semibold text-[var(--color-brand)] underline-offset-4 hover:underline focus-visible:underline"
            >
              {c.footerCta}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
