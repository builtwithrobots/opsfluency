"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useTransition } from "react";
import { Mail, Check, Loader2 } from "lucide-react";

type Step = "idle" | "entering" | "verifying" | "done";

const STRINGS = {
  en: {
    heading: "Email address",
    noEmail: "No email on file",
    noEmailHint: "Add an email to use magic links or set a password.",
    addEmail: "Add email",
    placeholder: "your@email.com",
    sending: "Sending code…",
    send: "Send verification code",
    verifyHint: "Enter the 6-digit code we sent to",
    codePlaceholder: "000000",
    verifying: "Verifying…",
    verify: "Verify",
    resend: "Resend code",
    doneMsg: "Email verified and saved.",
  },
  es: {
    heading: "Correo electrónico",
    noEmail: "Sin correo registrado",
    noEmailHint: "Agrega un correo para usar enlaces mágicos o contraseña.",
    addEmail: "Agregar correo",
    placeholder: "tu@correo.com",
    sending: "Enviando código…",
    send: "Enviar código de verificación",
    verifyHint: "Ingresa el código de 6 dígitos enviado a",
    codePlaceholder: "000000",
    verifying: "Verificando…",
    verify: "Verificar",
    resend: "Reenviar código",
    doneMsg: "Correo verificado y guardado.",
  },
} as const;

interface Props {
  lang: "en" | "es";
}

export function EmailSectionClient({ lang }: Props) {
  const t = STRINGS[lang];
  const { user, isLoaded } = useUser();
  const [step, setStep] = useState<Step>("idle");
  const [emailInput, setEmailInput] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Typed as unknown — Clerk's EmailAddressResource shape varies by version.
  // The methods we call (prepareVerification, attemptVerification) are stable.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [emailObj, setEmailObj] = useState<any>(null);
  const [pending, startTransition] = useTransition();

  if (!isLoaded || !user) return null;

  const primaryEmail = user.primaryEmailAddress?.emailAddress ?? null;

  // Already has a verified email — just show it
  if (primaryEmail && step !== "done") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dc-edge bg-dc-surface px-4 py-3.5">
        <Mail className="size-4 shrink-0 text-dc-text-3" strokeWidth={2} aria-hidden />
        <span className="min-w-0 flex-1 truncate text-sm text-dc-text">{primaryEmail}</span>
        <Check className="size-4 shrink-0 text-green-500" strokeWidth={2.5} aria-hidden />
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-green-300 bg-green-50 px-4 py-3.5 dark:border-green-800 dark:bg-green-950">
        <Check className="size-4 shrink-0 text-green-600 dark:text-green-400" strokeWidth={2.5} aria-hidden />
        <span className="text-sm font-medium text-green-700 dark:text-green-400">{t.doneMsg}</span>
      </div>
    );
  }

  if (step === "idle") {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-dc-edge bg-dc-surface px-4 py-4">
        <div className="flex items-center gap-2 text-dc-text-3">
          <Mail className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          <span className="text-sm">{t.noEmail}</span>
        </div>
        <p className="text-xs text-dc-text-3">{t.noEmailHint}</p>
        <button
          type="button"
          onClick={() => setStep("entering")}
          className="self-start rounded-lg border border-(--color-brand)/30 bg-(--color-brand)/10 px-3 py-1.5 text-sm font-semibold text-(--color-brand) hover:bg-(--color-brand)/20"
        >
          {t.addEmail}
        </button>
      </div>
    );
  }

  if (step === "entering") {
    function handleSend() {
      setError(null);
      startTransition(async () => {
        try {
          const obj = await user!.createEmailAddress({ email: emailInput.trim() });
          await obj.prepareVerification({ strategy: "email_code" });
          setEmailObj(obj);
          setStep("verifying");
        } catch (e: unknown) {
          const msg = (e as { errors?: { message: string }[] })?.errors?.[0]?.message ?? "Failed to send code.";
          setError(msg);
        }
      });
    }

    return (
      <div className="flex flex-col gap-3">
        <input
          type="email"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder={t.placeholder}
          className="w-full rounded-xl border border-dc-edge bg-dc-surface px-4 py-3.5 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none focus:ring-2 focus:ring-(--color-brand)/20"
        />
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="button"
          disabled={pending || !emailInput.trim()}
          onClick={handleSend}
          className="flex items-center justify-center gap-2 rounded-xl bg-(--color-brand) py-3.5 text-sm font-semibold text-white hover:bg-(--color-brand-hover) disabled:opacity-50"
        >
          {pending ? <><Loader2 className="size-4 animate-spin" strokeWidth={2} />{t.sending}</> : t.send}
        </button>
      </div>
    );
  }

  // step === "verifying"
  function handleVerify() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await emailObj!.attemptVerification({ code: code.trim() });
        if (result.verification.status === "verified") {
          await user!.reload();
          setStep("done");
        } else {
          setError("Code incorrect. Try again.");
        }
      } catch (e: unknown) {
        const msg = (e as { errors?: { message: string }[] })?.errors?.[0]?.message ?? "Verification failed.";
        setError(msg);
      }
    });
  }

  function handleResend() {
    setError(null);
    startTransition(async () => {
      try {
        await emailObj!.prepareVerification({ strategy: "email_code" });
      } catch {
        setError("Failed to resend. Try again.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-dc-text-2">
        {t.verifyHint} <span className="font-semibold text-dc-text">{emailInput}</span>
      </p>
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        placeholder={t.codePlaceholder}
        className="w-full rounded-xl border border-dc-edge bg-dc-surface px-4 py-3.5 text-center font-mono text-lg tracking-[0.4em] text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none focus:ring-2 focus:ring-(--color-brand)/20"
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="button"
        disabled={pending || code.length < 6}
        onClick={handleVerify}
        className="flex items-center justify-center gap-2 rounded-xl bg-(--color-brand) py-3.5 text-sm font-semibold text-white hover:bg-(--color-brand-hover) disabled:opacity-50"
      >
        {pending ? <><Loader2 className="size-4 animate-spin" strokeWidth={2} />{t.verifying}</> : t.verify}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={handleResend}
        className="text-xs text-dc-text-3 hover:text-dc-text disabled:opacity-50"
      >
        {t.resend}
      </button>
    </div>
  );
}
