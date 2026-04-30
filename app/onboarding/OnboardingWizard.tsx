"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { StepCompany } from "./_steps/StepCompany";
import { StepDepartments } from "./_steps/StepDepartments";
import { StepInvite } from "./_steps/StepInvite";

const STEPS = [
  { label: "Company",     description: "Name, phone & logo" },
  { label: "Departments", description: "Customize your 5 defaults" },
  { label: "Invite",      description: "Add your first teammate" },
] as const;

type Step = 1 | 2 | 3;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(1);

  function goTo(next: Step) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  function finish() {
    router.push("/dashboard?welcome=1");
  }

  return (
    <div className="flex w-full flex-col gap-8">
      {/* ── Step indicator ── */}
      <div className="flex flex-col gap-3">
        <p className="text-center text-xs font-semibold tracking-[0.15em] text-(--color-brand) uppercase">
          Step {step} of 3 — {STEPS[step - 1].description}
        </p>

        {/* Progress bar: 3 segments */}
        <div className="flex gap-1.5" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3}>
          {([1, 2, 3] as Step[]).map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                s <= step ? "bg-(--color-brand)" : "bg-(--color-brand)/15"
              }`}
            />
          ))}
        </div>

        {/* Step pills */}
        <div className="flex justify-between">
          {STEPS.map((s, i) => {
            const n = (i + 1) as Step;
            return (
              <span
                key={n}
                className={`text-xs transition-colors ${
                  n === step
                    ? "font-semibold text-dc-text"
                    : n < step
                      ? "text-(--color-brand)"
                      : "text-dc-text-3"
                }`}
              >
                {s.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* ── Step panel ── */}
      <div className="overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-6 shadow-xs">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {step === 1 && (
              <StepCompany onSuccess={() => goTo(2)} />
            )}
            {step === 2 && (
              <StepDepartments onContinue={() => goTo(3)} />
            )}
            {step === 3 && (
              <StepInvite onDone={finish} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
