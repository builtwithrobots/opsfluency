"use client";

import { AlertCircle } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Description, ErrorMessage, Field, Label } from "@/components/ui/fieldset";
import { Input } from "@/components/ui/input";

import { createCompanyAction, type CreateCompanyState } from "./actions";

const INITIAL_STATE: CreateCompanyState = { status: "idle" };

export function OnboardingForm() {
  const [state, formAction] = useActionState(createCompanyAction, INITIAL_STATE);
  const nameError = state.status === "error" ? state.fieldErrors?.name?.[0] : undefined;
  const phoneError = state.status === "error" ? state.fieldErrors?.phone?.[0] : undefined;
  const topError = state.status === "error" ? formatTopError(state) : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {topError ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-md border border-(--color-signal-urgent)/30 bg-(--color-signal-urgent)/10 px-4 py-3 text-sm text-(--color-signal-urgent)"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{topError}</span>
        </div>
      ) : null}

      <Field>
        <Label htmlFor="name">Company name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          maxLength={200}
          autoComplete="organization"
          placeholder="Acme Manufacturing"
          aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? "name-error" : undefined}
          invalid={Boolean(nameError)}
        />
        {nameError ? <ErrorMessage id="name-error">{nameError}</ErrorMessage> : null}
      </Field>

      <Field>
        <Label htmlFor="phone">
          Company phone <span className="font-normal text-dc-text-3">(optional)</span>
        </Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          maxLength={50}
          autoComplete="tel"
          placeholder="(555) 123-4567"
          aria-invalid={Boolean(phoneError)}
          aria-describedby={phoneError ? "phone-error" : undefined}
          invalid={Boolean(phoneError)}
        />
        {phoneError ? (
          <ErrorMessage id="phone-error">{phoneError}</ErrorMessage>
        ) : (
          <Description>
            Shown in the QR code print header. You can change this later in settings.
          </Description>
        )}
      </Field>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" color="brand" disabled={pending} className="mt-2 w-full">
      {pending ? "Creating your workspace…" : "Create company"}
    </Button>
  );
}

function formatTopError(state: Extract<CreateCompanyState, { status: "error" }>): string {
  switch (state.code) {
    case "UNAUTHENTICATED":
      return "Your session expired. Sign in again to continue.";
    case "ALREADY_MEMBER":
      return "You already belong to a company. Opening your dashboard…";
    case "INVALID_INPUT":
      return state.fieldErrors ? "Fix the highlighted fields and try again." : "Invalid input.";
    case "BRIDGE_UNCONFIGURED":
      return (
        "Your workspace was created, but Supabase can't see your Clerk session. " +
        "This means Clerk isn't registered as a Third-party Auth provider in your " +
        "Supabase project. In the Supabase dashboard go to Authentication → " +
        "Sign in / Providers → Third-party Auth → Add Clerk, paste your Clerk " +
        "Frontend API URL, then retry. (Your existing row is safe; we'll reuse it.)"
      );
    case "INTERNAL":
      return state.message ?? "Something went wrong creating your company.";
  }
}
