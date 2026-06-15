// v1.0.0
// Blueprint 2-col contact layout. FramedPanel form (left, with corner
// ticks) + sidebar (direct channels + "what happens next" note) (right).
// Replaces the stacked ContactForm / ContactDirectChannels pattern.

"use client";

import { CheckCircle2, Linkedin, Mail, Send } from "lucide-react";
import { useCallback, useId, useState } from "react";
import { z } from "zod";

import { Button } from "@/components/marketing/Button";
import { Container } from "@/components/marketing/Container";
import { FramedPanel } from "@/components/marketing/FramedPanel";
import { MotionSection } from "@/components/motion/MotionSection";
import {
  ContactFormSchema,
  EMPLOYEE_COUNTS,
  type ContactFormErrors,
  type ContactFormInput,
} from "@/lib/contact/schema";

type Status = "idle" | "submitting" | "success" | "error";

const EMPLOYEE_LABEL: Record<ContactFormInput["employees"], string> = {
  "1-50": "Up to 50",
  "51-150": "51 to 150",
  "151-500": "151 to 500",
  "500+": "500 or more",
};

type FormState = {
  name: string;
  email: string;
  company: string;
  employees: ContactFormInput["employees"] | "";
  message: string;
  main_problem: string;
};

const INITIAL: FormState = {
  name: "",
  email: "",
  company: "",
  employees: "",
  message: "",
  main_problem: "",
};

function validateField(
  field: keyof ContactFormInput,
  value: unknown,
): string | undefined {
  const schema = (ContactFormSchema.shape as Record<string, z.ZodTypeAny>)[field];
  if (!schema) return undefined;
  const result = schema.safeParse(value);
  if (result.success) return undefined;
  return result.error.issues[0]?.message ?? "Invalid value.";
}

function labelCls() {
  return "block text-sm font-medium text-dc-text";
}

function inputCls(invalid: boolean) {
  return [
    "mt-1.5 block w-full rounded-[4px] bg-dc-surface text-dc-text placeholder:text-dc-text-3",
    "px-4 py-2.5 text-base",
    invalid
      ? "border border-[var(--color-signal-urgent)]"
      : "border border-dc-edge-2",
    "transition-colors",
    "focus:outline-none focus:border-[var(--color-brand)] focus:shadow-[0_0_0_3px_rgba(20,184,166,0.15)]",
  ].join(" ");
}

function errorCls() {
  return "mt-1.5 text-sm text-[var(--color-signal-urgent)]";
}

const SIDEBAR_CHANNELS = [
  {
    id: "email",
    icon: <Mail className="h-5 w-5" strokeWidth={2} />,
    title: "Direct email",
    blurb: "Hits Rob's inbox. Reply usually same business day, often faster.",
    cta: "rob@opsfluency.com",
    href: "mailto:rob@opsfluency.com",
    external: false,
  },
  {
    id: "linkedin",
    icon: <Linkedin className="h-5 w-5" strokeWidth={2} />,
    title: "LinkedIn",
    blurb: "Public comments, DMs, or a connect request. Same human on the other end.",
    cta: "opsfluency on LinkedIn",
    href: "https://www.linkedin.com/company/opsfluency",
    external: true,
  },
] as const;

function Sidebar() {
  return (
    <div className="flex flex-col gap-6">
      {/* "Or just email" kicker */}
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="inline-block h-2 w-2 shrink-0"
          style={{ background: "var(--color-brand)" }}
        />
        <span
          className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Or just email
        </span>
      </div>

      {/* Channel cards */}
      {SIDEBAR_CHANNELS.map((ch) => (
        <a
          key={ch.id}
          href={ch.href}
          target={ch.external ? "_blank" : undefined}
          rel={ch.external ? "noopener noreferrer" : undefined}
          className="group flex flex-col gap-3 rounded-[4px] border border-dc-edge bg-dc-surface p-5 shadow-[0_1px_2px_rgba(15,17,23,0.04),_0_8px_24px_-14px_rgba(15,17,23,0.12)] dark:shadow-none transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-[3px] hover:shadow-[0_1px_2px_rgba(15,17,23,0.04),_0_16px_36px_-14px_rgba(15,17,23,0.18)] dark:hover:shadow-none"
        >
          <span
            aria-hidden="true"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md"
            style={{
              background: "color-mix(in srgb, var(--color-brand) 12%, transparent)",
              color: "var(--color-brand)",
            }}
          >
            {ch.icon}
          </span>
          <h3
            className="text-base font-semibold text-dc-text"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {ch.title}
          </h3>
          <p className="text-sm leading-relaxed text-dc-text-2">{ch.blurb}</p>
          <span
            className="text-sm font-semibold text-[var(--color-brand)] group-hover:underline"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {ch.cta}
          </span>
        </a>
      ))}

      {/* "What happens next" note */}
      <FramedPanel className="p-4">
        <p
          className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-dc-text-3"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          What happens next
        </p>
        <ol className="flex flex-col gap-2 text-sm text-dc-text-2">
          {[
            "Rob reads your note personally.",
            "Reply within one business day, usually faster.",
            "If it is a good fit, he proposes a 30-min call.",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2">
              <span
                aria-hidden="true"
                className="shrink-0 text-xs font-semibold tabular-nums text-[var(--color-brand)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {`0${i + 1}`}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </FramedPanel>
    </div>
  );
}

const FORM_HEADING_ID = "contact-form-heading";

export function ContactBody() {
  const reactId = useId();
  const [values, setValues] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [topLevelError, setTopLevelError] = useState<string | null>(null);

  const setField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      if (errors[field as keyof ContactFormInput]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field as keyof ContactFormInput];
          return next;
        });
      }
    },
    [errors],
  );

  const onBlur = useCallback(
    (field: keyof ContactFormInput) => {
      const value = values[field];
      const message = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: message }));
    },
    [values],
  );

  const onSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setTopLevelError(null);
      const parsed = ContactFormSchema.safeParse(values);
      if (!parsed.success) {
        const nextErrors: ContactFormErrors = {};
        for (const issue of parsed.error.issues) {
          const key = issue.path[0] as keyof ContactFormInput | undefined;
          if (key && !nextErrors[key]) nextErrors[key] = issue.message;
        }
        setErrors(nextErrors);
        return;
      }
      setStatus("submitting");
      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        if (!response.ok) {
          setStatus("error");
          setTopLevelError(
            "Something went wrong on our end. Try again in a minute, or email Rob directly.",
          );
          return;
        }
        setStatus("success");
      } catch {
        setStatus("error");
        setTopLevelError("Network error. Check your connection and try again.");
      }
    },
    [values],
  );

  return (
    <MotionSection
      aria-labelledby={FORM_HEADING_ID}
      className="border-t border-dc-edge bg-dc-raised py-12 md:py-16"
    >
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:gap-14 xl:grid-cols-[1fr_360px]">
          {/* Form panel */}
          {status === "success" ? (
            <FramedPanel withCornerTicks className="p-8 md:p-10">
              <div className="flex flex-col items-start gap-4">
                <span
                  aria-hidden="true"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-signal-ok)] text-white"
                >
                  <CheckCircle2 className="h-6 w-6" strokeWidth={2} />
                </span>
                <h2
                  id={FORM_HEADING_ID}
                  className="text-2xl font-semibold tracking-tight text-dc-text md:text-3xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Thanks. Rob will be in touch.
                </h2>
                <p className="text-base leading-relaxed text-dc-text-2">
                  You will get a reply from Rob within one business day, usually
                  faster. If it is urgent, the email below reaches him directly.
                </p>
              </div>
            </FramedPanel>
          ) : (
            <FramedPanel withCornerTicks className="p-8 md:p-10">
              <h2
                id={FORM_HEADING_ID}
                className="text-xl font-bold tracking-tight text-dc-text"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Send a note.
              </h2>
              <p className="mt-1 text-sm text-dc-text-2">
                Nothing gets forwarded to a sales team.
              </p>

              <form
                noValidate
                onSubmit={onSubmit}
                className="mt-7 flex flex-col gap-5"
              >
                {topLevelError ? (
                  <div
                    role="alert"
                    className="rounded-[4px] border border-[color-mix(in_srgb,var(--color-signal-urgent)_25%,transparent)] bg-[color-mix(in_srgb,var(--color-signal-urgent)_8%,transparent)] p-3 text-sm text-[var(--color-signal-urgent)]"
                  >
                    {topLevelError}
                  </div>
                ) : null}

                <div>
                  <label htmlFor={`${reactId}-name`} className={labelCls()}>
                    Name
                  </label>
                  <input
                    id={`${reactId}-name`}
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={values.name}
                    onChange={(e) => setField("name", e.target.value)}
                    onBlur={() => onBlur("name")}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? `${reactId}-name-error` : undefined}
                    className={inputCls(Boolean(errors.name))}
                    required
                  />
                  {errors.name ? (
                    <p id={`${reactId}-name-error`} className={errorCls()}>
                      {errors.name}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor={`${reactId}-email`} className={labelCls()}>
                    Work email
                  </label>
                  <input
                    id={`${reactId}-email`}
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={values.email}
                    onChange={(e) => setField("email", e.target.value)}
                    onBlur={() => onBlur("email")}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? `${reactId}-email-error` : undefined}
                    className={inputCls(Boolean(errors.email))}
                    required
                  />
                  {errors.email ? (
                    <p id={`${reactId}-email-error`} className={errorCls()}>
                      {errors.email}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor={`${reactId}-company`} className={labelCls()}>
                    Company
                  </label>
                  <input
                    id={`${reactId}-company`}
                    name="company"
                    type="text"
                    autoComplete="organization"
                    value={values.company}
                    onChange={(e) => setField("company", e.target.value)}
                    onBlur={() => onBlur("company")}
                    aria-invalid={Boolean(errors.company)}
                    aria-describedby={errors.company ? `${reactId}-company-error` : undefined}
                    className={inputCls(Boolean(errors.company))}
                    required
                  />
                  {errors.company ? (
                    <p id={`${reactId}-company-error`} className={errorCls()}>
                      {errors.company}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor={`${reactId}-employees`} className={labelCls()}>
                    Number of employees
                  </label>
                  <select
                    id={`${reactId}-employees`}
                    name="employees"
                    value={values.employees}
                    onChange={(e) =>
                      setField("employees", e.target.value as ContactFormInput["employees"])
                    }
                    onBlur={() => onBlur("employees")}
                    aria-invalid={Boolean(errors.employees)}
                    aria-describedby={errors.employees ? `${reactId}-employees-error` : undefined}
                    className={inputCls(Boolean(errors.employees))}
                    required
                  >
                    <option value="" disabled>
                      Select a range
                    </option>
                    {EMPLOYEE_COUNTS.map((value) => (
                      <option key={value} value={value}>
                        {EMPLOYEE_LABEL[value]}
                      </option>
                    ))}
                  </select>
                  {errors.employees ? (
                    <p id={`${reactId}-employees-error`} className={errorCls()}>
                      {errors.employees}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor={`${reactId}-message`} className={labelCls()}>
                    Message
                  </label>
                  <textarea
                    id={`${reactId}-message`}
                    name="message"
                    rows={5}
                    value={values.message}
                    onChange={(e) => setField("message", e.target.value)}
                    onBlur={() => onBlur("message")}
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? `${reactId}-message-error` : undefined}
                    className={inputCls(Boolean(errors.message))}
                    required
                    placeholder="A sentence or two about your team and what you are trying to solve."
                  />
                  {errors.message ? (
                    <p id={`${reactId}-message-error`} className={errorCls()}>
                      {errors.message}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor={`${reactId}-main-problem`} className={labelCls()}>
                    What are you trying to fix?{" "}
                    <span className="font-normal text-dc-text-3">(optional)</span>
                  </label>
                  <textarea
                    id={`${reactId}-main-problem`}
                    name="main_problem"
                    rows={4}
                    value={values.main_problem}
                    onChange={(e) => setField("main_problem", e.target.value)}
                    className={inputCls(false)}
                    placeholder="Briefly describe the main operational problem you are dealing with. This helps Rob come prepared."
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    size="lg"
                    loading={status === "submitting"}
                    trailingIcon={<Send className="h-4 w-4" strokeWidth={2} />}
                  >
                    Send
                  </Button>
                </div>
              </form>
            </FramedPanel>
          )}

          {/* Sidebar */}
          <Sidebar />
        </div>
      </Container>
    </MotionSection>
  );
}
