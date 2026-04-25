"use client";

import { GLOSSARY_DEFINITION_MAX, GLOSSARY_TERM_MAX } from "@/lib/types/glossary";

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
}

const inputBase =
  "w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

const labelBase = "mb-1 block text-xs font-medium text-dc-text-2";

/**
 * Bilingual term form fields, reused by the create and edit dialogs.
 * Two columns at sm+ — English left, Spanish right — with proper
 * `lang` attributes per the opsfluency-bilingual-content guidelines so
 * a screen reader reads each side in the correct voice.
 */
export function TermFormFields({ draft, onChange, disabled }: Props) {
  return (
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
          colSpan="sm:col-span-1"
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
        />
        <FieldArea
          label="Spanish definition (optional)"
          value={draft.definition_es}
          maxLength={GLOSSARY_DEFINITION_MAX}
          placeholder="Explicación breve en español sencillo"
          onChange={(v) => onChange({ definition_es: v })}
          disabled={disabled}
          lang="es"
          colSpan="sm:col-span-1"
        />
      </fieldset>
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
  }: {
    label: string;
    required?: boolean;
    value: string;
    maxLength: number;
    placeholder: string;
    onChange: (v: string) => void;
    disabled?: boolean;
    lang: string;
  }) {
    return (
      <div>
        <label className={labelBase}>
          {label}
          {required && <span className="ml-1 text-(--color-signal-urgent)">*</span>}
        </label>
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
    colSpan,
  }: {
    label: string;
    value: string;
    maxLength: number;
    placeholder: string;
    onChange: (v: string) => void;
    disabled?: boolean;
    lang: string;
    colSpan?: string;
  }) {
    return (
      <div className={colSpan}>
        <label className={labelBase}>{label}</label>
        <textarea
          rows={2}
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
