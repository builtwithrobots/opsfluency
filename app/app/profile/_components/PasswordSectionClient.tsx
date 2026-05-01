"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useTransition } from "react";
import { Lock, Eye, EyeOff, Loader2, Check } from "lucide-react";

const STRINGS = {
  en: {
    noEmailNotice: "Add an email address above before setting a password.",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    setPassword: "Set password",
    changePassword: "Change password",
    saving: "Saving…",
    saved: "Password saved.",
    mismatch: "Passwords don't match.",
    tooShort: "Password must be at least 8 characters.",
    showPassword: "Show password",
    hidePassword: "Hide password",
    cancelBtn: "Cancel",
    editBtn: "Set password",
    changeBtnLabel: "Change password",
    hasPassword: "Password set",
  },
  es: {
    noEmailNotice: "Agrega un correo arriba antes de establecer una contraseña.",
    currentPassword: "Contraseña actual",
    newPassword: "Nueva contraseña",
    confirmPassword: "Confirmar contraseña",
    setPassword: "Establecer contraseña",
    changePassword: "Cambiar contraseña",
    saving: "Guardando…",
    saved: "Contraseña guardada.",
    mismatch: "Las contraseñas no coinciden.",
    tooShort: "La contraseña debe tener al menos 8 caracteres.",
    showPassword: "Mostrar contraseña",
    hidePassword: "Ocultar contraseña",
    cancelBtn: "Cancelar",
    editBtn: "Establecer contraseña",
    changeBtnLabel: "Cambiar contraseña",
    hasPassword: "Contraseña establecida",
  },
} as const;

interface Props {
  lang: "en" | "es";
  hasEmail: boolean;
}

function PasswordInput({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold tracking-[0.1em] text-dc-text-3 uppercase">
        {label}
      </span>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={name === "current-password" ? "current-password" : "new-password"}
          className="w-full rounded-xl border border-dc-edge bg-dc-surface py-3.5 pl-4 pr-11 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none focus:ring-2 focus:ring-(--color-brand)/20"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-dc-text-3 hover:text-dc-text"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="size-4" strokeWidth={2} /> : <Eye className="size-4" strokeWidth={2} />}
        </button>
      </div>
    </label>
  );
}

export function PasswordSectionClient({ lang, hasEmail }: Props) {
  const t = STRINGS[lang];
  const { user, isLoaded } = useUser();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!isLoaded || !user) return null;

  const hasPassword = user.passwordEnabled ?? false;

  // No email — can't set a password (Clerk requires an identifier)
  if (!hasEmail) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dc-edge bg-dc-surface px-4 py-3.5">
        <Lock className="size-4 shrink-0 text-dc-text-3" strokeWidth={2} aria-hidden />
        <span className="text-sm text-dc-text-3">{t.noEmailNotice}</span>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-green-300 bg-green-50 px-4 py-3.5 dark:border-green-800 dark:bg-green-950">
        <Check className="size-4 shrink-0 text-green-600 dark:text-green-400" strokeWidth={2.5} aria-hidden />
        <span className="text-sm font-medium text-green-700 dark:text-green-400">{t.saved}</span>
      </div>
    );
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-dc-edge bg-dc-surface px-4 py-3.5">
        <div className="flex items-center gap-2 text-dc-text-2">
          <Lock className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          {hasPassword ? (
            <span className="text-sm">{t.hasPassword}</span>
          ) : (
            <span className="text-sm text-dc-text-3">—</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-lg border border-(--color-brand)/30 bg-(--color-brand)/10 px-3 py-1.5 text-sm font-semibold text-(--color-brand) hover:bg-(--color-brand)/20"
        >
          {hasPassword ? t.changeBtnLabel : t.editBtn}
        </button>
      </div>
    );
  }

  function handleSave() {
    setError(null);
    if (newPw.length < 8) { setError(t.tooShort); return; }
    if (newPw !== confirmPw) { setError(t.mismatch); return; }

    startTransition(async () => {
      try {
        await user!.updatePassword({
          newPassword: newPw,
          ...(hasPassword ? { currentPassword: currentPw } : {}),
          signOutOfOtherSessions: false,
        });
        setSaved(true);
        setEditing(false);
      } catch (e: unknown) {
        const msg = (e as { errors?: { message: string }[] })?.errors?.[0]?.message ?? "Failed to save password.";
        setError(msg);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-dc-edge bg-dc-surface p-4">
      {hasPassword && (
        <PasswordInput
          label={t.currentPassword}
          name="current-password"
          value={currentPw}
          onChange={setCurrentPw}
        />
      )}
      <PasswordInput
        label={t.newPassword}
        name="new-password"
        value={newPw}
        onChange={setNewPw}
      />
      <PasswordInput
        label={t.confirmPassword}
        name="confirm-password"
        value={confirmPw}
        onChange={setConfirmPw}
      />

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => { setEditing(false); setError(null); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }}
          className="flex-1 rounded-xl border border-dc-edge py-3 text-sm font-semibold text-dc-text-2 hover:bg-dc-overlay disabled:opacity-50"
        >
          {t.cancelBtn}
        </button>
        <button
          type="button"
          disabled={pending || !newPw || !confirmPw || (hasPassword && !currentPw)}
          onClick={handleSave}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-(--color-brand) py-3 text-sm font-semibold text-white hover:bg-(--color-brand-hover) disabled:opacity-50"
        >
          {pending
            ? <><Loader2 className="size-4 animate-spin" strokeWidth={2} />{t.saving}</>
            : hasPassword ? t.changePassword : t.setPassword}
        </button>
      </div>
    </div>
  );
}
