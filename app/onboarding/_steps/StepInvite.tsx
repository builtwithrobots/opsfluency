"use client";

import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { useState, useTransition } from "react";

import { sendOnboardingInviteAction } from "@/app/onboarding/_actions/wizard-actions";
import { Button } from "@/components/ui/button";
import { Description, ErrorMessage, Field, Label } from "@/components/ui/fieldset";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface Props {
  onDone: () => void;
}

export function StepInvite({ onDone }: Props) {
  const [sent, setSent] = useState<string | null>(null); // email that was invited
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();

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
            automatically when they accept.
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
          placeholder="teammate@yourcompany.com"
        />
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

      <Field>
        <Label htmlFor="invite-role">Role</Label>
        <Select id="invite-role" name="role" defaultValue="manager">
          <option value="manager">Manager — can manage SOPs and employees in their departments</option>
          <option value="admin">Admin — full org access including billing and settings</option>
        </Select>
        <Description>You can change this later in Org Settings → Team.</Description>
      </Field>

      <div className="flex flex-col gap-3 mt-2">
        <Button type="submit" color="brand" disabled={isPending} className="w-full">
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
