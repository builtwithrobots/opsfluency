"use client";

import { AlertCircle, Building2, ImageIcon, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";

import {
  createCompanyWizardAction,
  type CreateCompanyWizardState,
  uploadLogoAction,
} from "@/app/onboarding/_actions/wizard-actions";
import { Button } from "@/components/ui/button";
import { Description, ErrorMessage, Field, Label } from "@/components/ui/fieldset";
import { Input } from "@/components/ui/input";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

interface Props {
  onSuccess: (companyId: string) => void;
}

const INITIAL: CreateCompanyWizardState = { status: "idle" };

export function StepCompany({ onSuccess }: Props) {
  const [state, formAction] = useActionState(createCompanyWizardAction, INITIAL);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoWarning, setLogoWarning] = useState<string | null>(null);
  const [isUploading, startUploadTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const successHandled = useRef(false);

  const nameError = state.status === "error" ? state.fieldErrors?.name?.[0] : undefined;
  const phoneError = state.status === "error" ? state.fieldErrors?.phone?.[0] : undefined;
  const topError = state.status === "error" ? formatTopError(state) : undefined;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (!ALLOWED_TYPES.has(file.type)) {
      setLogoWarning("Only JPEG, PNG, WebP, or GIF allowed.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setLogoWarning("Logo must be under 2 MB.");
      return;
    }
    setLogoWarning(null);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function clearLogo() {
    setLogoFile(null);
    setLogoPreview(null);
    setLogoWarning(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // After company creation succeeds, upload logo (non-fatal) then advance.
  async function handleSuccess(companyId: string) {
    startUploadTransition(async () => {
      if (logoFile) {
        const fd = new FormData();
        fd.append("file", logoFile);
        const r = await uploadLogoAction(fd);
        if (!r.ok) setLogoWarning("Logo couldn't be saved — you can upload it in Settings later.");
      }
      onSuccess(companyId);
    });
  }

  useEffect(() => {
    if (state.status === "success" && !successHandled.current) {
      successHandled.current = true;
      void handleSuccess(state.company_id);
    }
  // handleSuccess closes over stable refs/state; state is the only trigger.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-6" noValidate>
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
          <Description>Shown in QR print headers. Change anytime in Settings.</Description>
        )}
      </Field>

      {/* ── Address (optional) ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-dc-text">
            Company address <span className="font-normal text-dc-text-3">(optional)</span>
          </span>
          <span className="text-xs text-dc-text-3">Complete in Settings later</span>
        </div>

        <Field>
          <Label htmlFor="address_line1" className="sr-only">Street address</Label>
          <Input
            id="address_line1"
            name="address_line1"
            type="text"
            maxLength={200}
            autoComplete="address-line1"
            placeholder="Street address"
          />
        </Field>

        <Field>
          <Label htmlFor="address_line2" className="sr-only">Suite / unit (optional)</Label>
          <Input
            id="address_line2"
            name="address_line2"
            type="text"
            maxLength={200}
            autoComplete="address-line2"
            placeholder="Suite / unit (optional)"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field className="col-span-2 sm:col-span-1">
            <Label htmlFor="city" className="sr-only">City</Label>
            <Input
              id="city"
              name="city"
              type="text"
              maxLength={100}
              autoComplete="address-level2"
              placeholder="City"
            />
          </Field>
          <Field>
            <Label htmlFor="state" className="sr-only">State</Label>
            <Input
              id="state"
              name="state"
              type="text"
              maxLength={100}
              autoComplete="address-level1"
              placeholder="State"
            />
          </Field>
          <Field>
            <Label htmlFor="zip" className="sr-only">ZIP code</Label>
            <Input
              id="zip"
              name="zip"
              type="text"
              maxLength={20}
              autoComplete="postal-code"
              placeholder="ZIP"
            />
          </Field>
        </div>
      </div>

      {/* ── Logo upload ── */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-dc-text">
          Company logo <span className="font-normal text-dc-text-3">(optional)</span>
        </span>

        {logoPreview ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoPreview}
              alt="Logo preview"
              className="size-14 rounded-lg border border-[color:var(--dc-edge)] object-contain bg-dc-raised p-1"
            />
            <div className="flex flex-col gap-1">
              <span className="text-sm text-dc-text-2 truncate max-w-[180px]">{logoFile?.name}</span>
              <button
                type="button"
                onClick={clearLogo}
                className="flex items-center gap-1 text-xs text-dc-text-3 hover:text-(--color-signal-urgent) transition-colors"
              >
                <X className="size-3" strokeWidth={2} />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-[color:var(--dc-edge)] bg-dc-raised px-4 py-5 text-sm text-dc-text-3 hover:border-(--color-brand)/40 hover:text-(--color-brand) transition-colors"
          >
            <ImageIcon className="size-4" strokeWidth={2} />
            <span>Click to upload logo</span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          onChange={handleFileChange}
          aria-label="Upload company logo"
        />

        {logoWarning ? (
          <p className="text-xs text-(--color-signal-urgent)">{logoWarning}</p>
        ) : (
          <p className="text-xs text-dc-text-3">JPEG, PNG, WebP or GIF · max 2 MB</p>
        )}
      </div>

      <SubmitButton isUploading={isUploading} />
    </form>
  );
}

function SubmitButton({ isUploading }: { isUploading: boolean }) {
  const { pending } = useFormStatus();
  const busy = pending || isUploading;
  return (
    <Button type="submit" color="brand" disabled={busy} className="mt-2 w-full">
      <Building2 data-slot="icon" strokeWidth={2} />
      {busy ? "Setting up…" : "Continue →"}
    </Button>
  );
}

function formatTopError(state: Extract<CreateCompanyWizardState, { status: "error" }>): string {
  switch (state.code) {
    case "UNAUTHENTICATED":
      return "Your session expired. Sign in again to continue.";
    case "ALREADY_MEMBER":
      return "You already belong to a company. Opening your dashboard…";
    case "INVALID_INPUT":
      return state.fieldErrors ? "Fix the highlighted fields and try again." : "Invalid input.";
    case "BRIDGE_UNCONFIGURED":
      return (
        "Your workspace was created, but the auth bridge isn't configured. " +
        "In Supabase → Authentication → Third-party Auth → Add Clerk."
      );
    case "INTERNAL":
      return state.message ?? "Something went wrong. Please try again.";
  }
}
