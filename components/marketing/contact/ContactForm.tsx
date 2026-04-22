// v1.0.0
// Contact form. Controlled inputs, Zod onBlur validation per field,
// whole-form parse on submit, disabled + loading state while POSTing,
// dedicated success state after a clean response.
//
// Uses the MASTER input spec verbatim: 16px font-size (prevents iOS
// auto-zoom), bg-dc-surface, border-dc-edge-2, focus-visible ring
// inherited globally. Error messages live below each field and are
// wired via aria-describedby, with aria-invalid toggled on the input.

"use client";

import { CheckCircle2, Send } from "lucide-react";
import { useCallback, useId, useState } from "react";
import { z } from "zod";

import { Button } from "@/components/marketing/Button";
import { Container } from "@/components/marketing/Container";
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
};

const INITIAL: FormState = {
  name: "",
  email: "",
  company: "",
  employees: "",
  message: "",
};

function validateField(
  field: keyof ContactFormInput,
  value: unknown,
): string | undefined {
  const schema = (ContactFormSchema.shape as Record<string, z.ZodTypeAny>)[
    field
  ];
  if (!schema) return undefined;
  const result = schema.safeParse(value);
  if (result.success) return undefined;
  return result.error.issues[0]?.message ?? "Invalid value.";
}

function labelClasses() {
  return "block text-sm font-medium text-dc-text";
}

function inputClasses(invalid: boolean) {
  return [
    "mt-1.5 block w-full rounded-md bg-dc-surface text-dc-text placeholder:text-dc-text-3",
    "px-4 py-2.5 text-base",
    invalid ? "border border-[var(--color-signal-urgent)]" : "border border-dc-edge-2",
    "transition-colors focus:border-[var(--color-brand)]",
  ].join(" ");
}

function errorClasses() {
  return "mt-1.5 inline-flex items-start gap-1.5 text-sm text-[var(--color-signal-urgent)]";
}

const HEADING_ID = "contact-form-heading";

export function ContactForm() {
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
        setTopLevelError(
          "Network error. Check your connection and try again.",
        );
      }
    },
    [values],
  );

  if (status === "success") {
    return (
      <MotionSection
        aria-labelledby={HEADING_ID}
        className="py-10 md:py-16"
      >
        <Container width="prose">
          <div className="flex flex-col items-start gap-4 rounded-xl border border-[color-mix(in_srgb,var(--color-signal-ok)_25%,transparent)] bg-[color-mix(in_srgb,var(--color-signal-ok)_8%,transparent)] p-8">
            <span
              aria-hidden="true"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-signal-ok)] text-white"
            >
              <CheckCircle2 className="h-6 w-6" strokeWidth={2} />
            </span>
            <h2
              id={HEADING_ID}
              className="text-2xl font-semibold tracking-tight text-dc-text md:text-3xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Thanks. Rob will be in touch.
            </h2>
            <p className="text-base leading-relaxed text-dc-text-2">
              You will get a reply from Rob within one business day, usually faster. If it is urgent, the email below reaches him directly.
            </p>
          </div>
        </Container>
      </MotionSection>
    );
  }

  return (
    <MotionSection
      aria-labelledby={HEADING_ID}
      className="py-10 md:py-16"
    >
      <Container width="prose">
        <h2
          id={HEADING_ID}
          className="text-2xl font-semibold tracking-tight text-dc-text md:text-3xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Send a note.
        </h2>
        <p className="mt-2 text-base leading-relaxed text-dc-text-2">
          Five fields. Nothing gets forwarded to a sales team.
        </p>

        <form
          noValidate
          onSubmit={onSubmit}
          className="mt-8 flex flex-col gap-5"
        >
          {topLevelError ? (
            <div
              role="alert"
              className="rounded-md border border-[color-mix(in_srgb,var(--color-signal-urgent)_25%,transparent)] bg-[color-mix(in_srgb,var(--color-signal-urgent)_8%,transparent)] p-3 text-sm text-[var(--color-signal-urgent)]"
            >
              {topLevelError}
            </div>
          ) : null}

          <div>
            <label htmlFor={`${reactId}-name`} className={labelClasses()}>
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
              className={inputClasses(Boolean(errors.name))}
              required
            />
            {errors.name ? (
              <p id={`${reactId}-name-error`} className={errorClasses()}>
                {errors.name}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor={`${reactId}-email`} className={labelClasses()}>
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
              aria-describedby={
                errors.email ? `${reactId}-email-error` : undefined
              }
              className={inputClasses(Boolean(errors.email))}
              required
            />
            {errors.email ? (
              <p id={`${reactId}-email-error`} className={errorClasses()}>
                {errors.email}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor={`${reactId}-company`}
              className={labelClasses()}
            >
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
              aria-describedby={
                errors.company ? `${reactId}-company-error` : undefined
              }
              className={inputClasses(Boolean(errors.company))}
              required
            />
            {errors.company ? (
              <p id={`${reactId}-company-error`} className={errorClasses()}>
                {errors.company}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor={`${reactId}-employees`}
              className={labelClasses()}
            >
              Number of employees
            </label>
            <select
              id={`${reactId}-employees`}
              name="employees"
              value={values.employees}
              onChange={(e) =>
                setField(
                  "employees",
                  e.target.value as ContactFormInput["employees"],
                )
              }
              onBlur={() => onBlur("employees")}
              aria-invalid={Boolean(errors.employees)}
              aria-describedby={
                errors.employees
                  ? `${reactId}-employees-error`
                  : undefined
              }
              className={inputClasses(Boolean(errors.employees))}
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
              <p
                id={`${reactId}-employees-error`}
                className={errorClasses()}
              >
                {errors.employees}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor={`${reactId}-message`}
              className={labelClasses()}
            >
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
              aria-describedby={
                errors.message ? `${reactId}-message-error` : undefined
              }
              className={inputClasses(Boolean(errors.message))}
              required
              placeholder="A sentence or two about your team and what you are trying to solve."
            />
            {errors.message ? (
              <p
                id={`${reactId}-message-error`}
                className={errorClasses()}
              >
                {errors.message}
              </p>
            ) : null}
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
      </Container>
    </MotionSection>
  );
}
