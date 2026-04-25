"use client";

import { useState, useTransition } from "react";
import { Languages } from "lucide-react";

import { GLOSSARY_DEFINITION_MAX, GLOSSARY_TERM_MAX } from "@/lib/types/glossary";

import { suggestTranslation } from "../_actions/glossary";

export interface TermDraft {
  term_en: string;
  term_es: string;
  definition_en: string;
  definition_es: string;
}

export const EMPTY_DRAFT: TermDraft = {
  term_en: "",
  term_es: "",
  definition_en: "",
  definition_es: "",
};

interface Props {
  draft: TermDraft;
  onChange: (patch: Partial<TermDraft>) => void;
  disabled?: boolean;
  /**
   * The original English term when editing — passed to
   * `suggestTranslation` so the in-flight term doesn't substitute
   * itself out of its own definition during glossary placeholder
   * substitution. `null` (default) for the create flow.
   */
  excludeTermLower?: string | null;
}

const inputBase =
  "w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

const labelBase = "block text-xs font-medium text-dc-text-2";

type SuggestField = "term_es" | "definition_es";

/**
 * Bilingual term form fields, reused by the create and edit dialogs.
 * Two columns at sm+ — English left, Spanish right — with proper
 * `lang` attributes per the opsfluency-bilingual-content guidelines so
 * a screen reader reads each side in the correct voice.
 *
 * Each Spanish field carries a "Translate from English" affordance
 * that runs the corresponding English value through Google Translate
 * (with the company glossary as context) and writes the result into
 * the Spanish field. Replaces existing Spanish text — the manager is
 * expected to edit the result before clicking Save.
 */
export function TermFormFields({
  draft,
  onChange,
  disabled,
  excludeTermLower = null,
}: Props) {
  const [pendingField, setPendingField] = useState<SuggestField | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function suggest(field: SuggestField) {
    const sourceText =
      field === "term_es" ? draft.term_en.trim() : draft.definition_en.trim();
    if (!sourceText) return;
    setError(null);
    setPendingField(field);
    startTransition(async () => {
      const r = await suggestTranslation({
        text: sourceText,
        excludeTermLower: excludeTermLower ?? null,
      });
      setPendingField(null);
      if (!r.ok) {
        setError(
          r.error.message ?? "Couldn't fetch a translation suggestion. Try again.",
        );
        return;
      }
      onChange({ [field]: r.data.translated } as Partial<TermDraft>);
    });
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
        <fieldset className="contents" lang="en">
          <legend className="sr-only">English</legend>
          <Field
            label="English term"
            required
            value={draft.term_en}
            maxLength={GLOSSARY_TERM_MAX}
            placeholder="e.g. Forklift"
            onChange={(v) => onChange({ term_en: v })}
            disabled={disabled}
            lang="en"
          />
          <FieldArea
            label="English definition (optional)"
            value={draft.definition_en}
            maxLength={GLOSSARY_DEFINITION_MAX}
            placeholder="A short, plain-language explanation"
            onChange={(v) => onChange({ definition_en: v })}
            disabled={disabled}
            lang="en"
          />
        </fieldset>

        <fieldset className="contents" lang="es">
          <legend className="sr-only">Spanish</legend>
          <Field
            label="Spanish term"
            required
            value={draft.term_es}
            maxLength={GLOSSARY_TERM_MAX}
            placeholder="p. ej. Montacargas"
            onChange={(v) => onChange({ term_es: v })}
            disabled={disabled}
            lang="es"
            translateAction={
              <TranslateLink
                onClick={() => suggest("term_es")}
                disabled={Boolean(disabled) || !draft.term_en.trim() || pendingField !== null}
                pending={pendingField === "term_es"}
                hasContent={Boolean(draft.term_es.trim())}
              />
            }
          />
          <FieldArea
            label="Spanish definition (optional)"
            value={draft.definition_es}
            maxLength={GLOSSARY_DEFINITION_MAX}
            placeholder="Explicación breve en español sencillo"
            onChange={(v) => onChange({ definition_es: v })}
            disabled={disabled}
            lang="es"
            translateAction={
              <TranslateLink
                onClick={() => suggest("definition_es")}
                disabled={
                  Boolean(disabled) || !draft.definition_en.trim() || pendingField !== null
                }
                pending={pendingField === "definition_es"}
                hasContent={Boolean(draft.definition_es.trim())}
              />
            }
          />
        </fieldset>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-md border border-[color:var(--dc-edge)] bg-(--color-signal-urgent)/5 px-3 py-2 text-sm text-(--color-signal-urgent)"
        >
          {error}
        </p>
      )}
    </div>
  );

  function Field({
    label,
    required,
    value,
    maxLength,
    placeholder,
    onChange,
    disabled,
    lang,
    translateAction,
  }: {
    label: string;
    required?: boolean;
    value: string;
    maxLength: number;
    placeholder: string;
    onChange: (v: string) => void;
    disabled?: boolean;
    lang: string;
    translateAction?: React.ReactNode;
  }) {
    return (
      <div>
        <div className="mb-1 flex items-center justify-between gap-3">
          <label className={labelBase}>
            {label}
            {required && <span className="ml-1 text-(--color-signal-urgent)">*</span>}
          </label>
          {translateAction}
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          lang={lang}
          className={inputBase}
        />
      </div>
    );
  }

  function FieldArea({
    label,
    value,
    maxLength,
    placeholder,
    onChange,
    disabled,
    lang,
    translateAction,
  }: {
    label: string;
    value: string;
    maxLength: number;
    placeholder: string;
    onChange: (v: string) => void;
    disabled?: boolean;
    lang: string;
    translateAction?: React.ReactNode;
  }) {
    return (
      <div>
        <div className="mb-1 flex items-center justify-between gap-3">
          <label className={labelBase}>{label}</label>
          {translateAction}
        </div>
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={disabled}
          lang={lang}
          className={inputBase}
        />
      </div>
    );
  }
}

function TranslateLink({
  onClick,
  disabled,
  pending,
  hasContent,
}: {
  onClick: () => void;
  disabled: boolean;
  pending: boolean;
  hasContent: boolean;
}) {
  // Bordered button rather than a text link so the affordance reads as
  // an action rather than an annotation. Both states replace the field
  // on click — manager edits before saving.
  const label = pending
    ? "Translating…"
    : hasContent
      ? "Re-translate"
      : "Translate from English";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-md border border-(--color-brand)/40 bg-(--color-brand)/5 px-2.5 py-1 text-[11px] font-medium text-(--color-brand) transition-colors hover:bg-(--color-brand)/15 disabled:cursor-not-allowed disabled:border-[color:var(--dc-edge)] disabled:bg-transparent disabled:text-dc-text-3"
    >
      <Languages
        className={`size-3 ${pending ? "animate-pulse" : ""}`}
        strokeWidth={2}
        aria-hidden
      />
      {label}
    </button>
  );
}
