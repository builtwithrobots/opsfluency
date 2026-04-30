"use client";

import { AlertCircle, CheckCircle2, Mail, Users } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import {
  getOnboardingDepartmentsAction,
  sendOnboardingInviteAction,
  type OnboardingDepartment,
} from "@/app/onboarding/_actions/wizard-actions";
import { Button } from "@/components/ui/button";
import { Description, ErrorMessage, Field, Label } from "@/components/ui/fieldset";
import { Input } from "@/components/ui/input";

interface Props {
  onDone: () => void;
}

export function StepInvite({ onDone }: Props) {
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [deptError, setDeptError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [departments, setDepartments] = useState<OnboardingDepartment[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [depsLoading, startDepsTransition] = useTransition();

  useEffect(() => {
    startDepsTransition(async () => {
      const result = await getOnboardingDepartmentsAction();
      if (result.ok) setDepartments(result.data);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setEmailError(null);
    setDeptError(null);

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const dept = String(fd.get("department_id") ?? "").trim();

    if (!email) {
      setEmailError("Email address is required.");
      return;
    }
    if (!dept) {
      setDeptError("Please select a department for this manager.");
      return;
    }

    startTransition(async () => {
      const result = await sendOnboardingInviteAction(fd);
      if (result.ok) {
        setSent(email);
      } else {
        setError(result.error);
      }
    });
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-6 py-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-(--color-brand)/10">
          <CheckCircle2 className="size-7 text-(--color-brand)" strokeWidth={2} />
        </span>
        <div>
          <p className="text-base font-semibold text-dc-text">Invite sent!</p>
          <p className="mt-1 text-sm text-dc-text-2">
            <span className="font-medium text-dc-text">{sent}</span> will receive an
            email with a secure sign-in link. They&apos;ll be added to your org
            as a Manager when they accept.
          </p>
        </div>
        <Button type="button" color="brand" onClick={onDone} className="w-full">
          Open your dashboard →
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <div className="flex items-start gap-3 rounded-lg bg-dc-raised border border-[color:var(--dc-edge)] px-4 py-3">
        <Users className="mt-0.5 size-4 shrink-0 text-(--color-brand)" strokeWidth={2} />
        <p className="text-sm text-dc-text-2">
          Invite your first <span className="font-medium text-dc-text">department manager</span>.
          They&apos;ll get a secure sign-in link and can immediately start managing SOPs and
          employees in their department.
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-md border border-(--color-signal-urgent)/30 bg-(--color-signal-urgent)/10 px-4 py-3 text-sm text-(--color-signal-urgent)"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      ) : null}

      <Field>
        <Label htmlFor="invite-email">Email address</Label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          required
          autoComplete="off"
          placeholder="manager@yourcompany.com"
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? "email-error" : undefined}
          invalid={Boolean(emailError)}
        />
        {emailError ? <ErrorMessage id="email-error">{emailError}</ErrorMessage> : null}
      </Field>

      <Field>
        <Label htmlFor="invite-name">
          Their name <span className="font-normal text-dc-text-3">(optional)</span>
        </Label>
        <Input
          id="invite-name"
          name="name"
          type="text"
          maxLength={100}
          autoComplete="off"
          placeholder="Jane Smith"
        />
      </Field>

      {/* Hidden role — always Manager for onboarding */}
      <input type="hidden" name="role" value="manager" />

      <Field>
        <Label htmlFor="invite-department">Department</Label>
        {depsLoading ? (
          <div className="h-10 rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised animate-pulse" />
        ) : (
          <select
            id="invite-department"
            name="department_id"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            aria-invalid={Boolean(deptError)}
            aria-describedby={deptError ? "dept-error" : undefined}
            className={`block w-full rounded-lg border px-3 py-2 text-sm text-dc-text bg-dc-surface focus:outline-none focus:ring-2 focus:ring-(--color-brand)/50 transition-colors ${
              deptError
                ? "border-(--color-signal-urgent)"
                : "border-[color:var(--dc-edge)] hover:border-(--color-brand)/40"
            }`}
          >
            <option value="">Select a department…</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        )}
        {deptError ? (
          <ErrorMessage id="dept-error">{deptError}</ErrorMessage>
        ) : (
          <Description>This manager will oversee SOPs and employees in this department.</Description>
        )}
      </Field>

      <div className="flex flex-col gap-3 mt-2">
        <Button type="submit" color="brand" disabled={isPending || depsLoading} className="w-full">
          <Mail data-slot="icon" strokeWidth={2} />
          {isPending ? "Sending invite…" : "Send invite"}
        </Button>

        <button
          type="button"
          onClick={onDone}
          className="text-sm text-dc-text-3 hover:text-dc-text-2 transition-colors py-1"
        >
          Skip for now — I&apos;ll invite people later
        </button>
      </div>
    </form>
  );
}
