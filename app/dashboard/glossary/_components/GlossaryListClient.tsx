"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, Archive, ArchiveRestore, Pencil, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { GlossaryTerm } from "@/lib/types/glossary";

import {
  archiveGlossaryTerm,
  restoreGlossaryTerm,
  updateGlossaryTerm,
} from "../_actions/glossary";

import { TermFormFields, type TermDraft } from "./TermFormFields";

interface Props {
  view: "active" | "archived";
  terms: GlossaryTerm[];
  query: string;
}

type Mode =
  | { kind: "closed" }
  | { kind: "edit"; term: GlossaryTerm }
  | { kind: "archive"; term: GlossaryTerm }
  | { kind: "restore"; term: GlossaryTerm };

export function GlossaryListClient({ view, terms, query }: Props) {
  const [mode, setMode] = useState<Mode>({ kind: "closed" });

  if (terms.length === 0) {
    return <NoResults view={view} query={query} />;
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {terms.map((term) => (
          <li key={term.id}>
            <TermRow term={term} view={view} onAction={setMode} />
          </li>
        ))}
      </ul>

      {mode.kind === "edit" && (
        <EditDialog term={mode.term} onClose={() => setMode({ kind: "closed" })} />
      )}
      {mode.kind === "archive" && (
        <ArchiveDialog term={mode.term} onClose={() => setMode({ kind: "closed" })} />
      )}
      {mode.kind === "restore" && (
        <RestoreDialog term={mode.term} onClose={() => setMode({ kind: "closed" })} />
      )}
    </>
  );
}

function NoResults({ view, query }: { view: "active" | "archived"; query: string }) {
  if (query) {
    return (
      <div className="rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-6 py-10 text-center">
        <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-dc-overlay text-dc-text-3">
          <Search className="size-5" strokeWidth={1.75} aria-hidden />
        </div>
        <p className="mt-3 text-sm text-dc-text-2">
          No {view} terms matching <span className="font-medium text-dc-text">&ldquo;{query}&rdquo;</span>.
        </p>
      </div>
    );
  }
  if (view === "archived") {
    return (
      <div className="rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-6 py-10 text-center">
        <p className="text-sm text-dc-text-2">No archived terms.</p>
      </div>
    );
  }
  return null;
}

function TermRow({
  term,
  view,
  onAction,
}: {
  term: GlossaryTerm;
  view: "active" | "archived";
  onAction: (mode: Mode) => void;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs transition-colors hover:border-(--color-brand)/40">
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
        <LangCell
          lang="en"
          flagLabel="EN"
          term={term.term_en}
          definition={term.definition_en}
        />
        <LangCell
          lang="es"
          flagLabel="ES"
          term={term.term_es}
          definition={term.definition_es}
        />

        <div className="flex items-center gap-1 sm:flex-col sm:items-end sm:gap-1.5">
          {view === "active" ? (
            <>
              <RowAction
                label="Edit"
                icon={Pencil}
                onClick={() => onAction({ kind: "edit", term })}
              />
              <RowAction
                label="Archive"
                icon={Archive}
                tone="muted"
                onClick={() => onAction({ kind: "archive", term })}
              />
            </>
          ) : (
            <RowAction
              label="Restore"
              icon={ArchiveRestore}
              onClick={() => onAction({ kind: "restore", term })}
            />
          )}
        </div>
      </div>
    </article>
  );
}

function LangCell({
  lang,
  flagLabel,
  term,
  definition,
}: {
  lang: "en" | "es";
  flagLabel: string;
  term: string;
  definition: string | null;
}) {
  return (
    <div lang={lang} className="min-w-0">
      <div className="mb-1 flex items-center gap-2">
        <span className="rounded bg-dc-overlay px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-dc-text-3 uppercase">
          {flagLabel}
        </span>
      </div>
      <p className="text-base font-medium break-words text-dc-text">{term}</p>
      {definition && (
        <p className="mt-1 text-sm break-words text-dc-text-2">{definition}</p>
      )}
    </div>
  );
}

function RowAction({
  label,
  icon: Icon,
  onClick,
  tone = "default",
}: {
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
  onClick: () => void;
  tone?: "default" | "muted";
}) {
  const toneClass =
    tone === "muted"
      ? "text-dc-text-3 hover:text-dc-text-2 hover:bg-dc-overlay"
      : "text-dc-text-2 hover:text-(--color-brand) hover:bg-(--color-brand)/10";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${toneClass}`}
    >
      <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
      {label}
    </button>
  );
}

// ── Dialogs ──────────────────────────────────────────────────────────────────

function EditDialog({ term, onClose }: { term: GlossaryTerm; onClose: () => void }) {
  const router = useRouter();
  const [draft, setDraft] = useState<TermDraft>({
    term_en: term.term_en,
    term_es: term.term_es,
    definition_en: term.definition_en ?? "",
    definition_es: term.definition_es ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Reset state when the targeted term changes (e.g. user opens edit for a
  // different row without closing first).
  useEffect(() => {
    setDraft({
      term_en: term.term_en,
      term_es: term.term_es,
      definition_en: term.definition_en ?? "",
      definition_es: term.definition_es ?? "",
    });
    setError(null);
  }, [term]);

  function patch(p: Partial<TermDraft>) {
    setDraft((prev) => ({ ...prev, ...p }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.term_en.trim() || !draft.term_es.trim()) {
      setError("English and Spanish terms are both required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await updateGlossaryTerm({ id: term.id, ...draft });
      if (!r.ok) {
        setError(r.error.message ?? r.error.code);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog open onClose={() => !isPending && onClose()} size="2xl">
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit term</DialogTitle>
        <DialogDescription>
          Changes apply on the next translation of any SOP. Already-published Spanish stays
          as-is until that SOP is re-translated.
        </DialogDescription>

        <DialogBody>
          <TermFormFields draft={draft} onChange={patch} disabled={isPending} />

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-md border border-[color:var(--dc-edge)] bg-(--color-signal-urgent)/5 px-3 py-2 text-sm text-(--color-signal-urgent)"
            >
              {error}
            </p>
          )}
        </DialogBody>

        <DialogActions>
          <Button plain type="button" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            color="brand"
            disabled={isPending || !draft.term_en.trim() || !draft.term_es.trim()}
          >
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function ArchiveDialog({ term, onClose }: { term: GlossaryTerm; onClose: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function archive() {
    setError(null);
    startTransition(async () => {
      const r = await archiveGlossaryTerm({ id: term.id });
      if (!r.ok) {
        setError(r.error.message ?? r.error.code);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog open onClose={() => !isPending && onClose()} size="md">
      <DialogTitle>Archive &ldquo;{term.term_en}&rdquo;?</DialogTitle>
      <DialogDescription>
        Archived terms stop being included in new SOP translations. Already-translated SOPs
        keep their current Spanish until you re-translate them — at which point this term
        will no longer be enforced. You can restore it later from the Archived tab.
      </DialogDescription>

      <DialogBody>
        <div className="rounded-md border border-(--color-signal-warn) bg-(--color-signal-warn)/5 p-3 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-(--color-signal-warn)"
              strokeWidth={1.75}
              aria-hidden
            />
            <p className="text-dc-text-2">
              <span className="font-medium text-dc-text">Heads up:</span> if this term appears
              in published SOPs, future re-translations may produce a different Spanish than
              what your team has been reading.
            </p>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-md border border-[color:var(--dc-edge)] bg-(--color-signal-urgent)/5 px-3 py-2 text-sm text-(--color-signal-urgent)"
          >
            {error}
          </p>
        )}
      </DialogBody>

      <DialogActions>
        <Button plain onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button color="dark" onClick={archive} disabled={isPending}>
          {isPending ? "Archiving…" : "Archive term"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function RestoreDialog({ term, onClose }: { term: GlossaryTerm; onClose: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function restore() {
    setError(null);
    startTransition(async () => {
      const r = await restoreGlossaryTerm({ id: term.id });
      if (!r.ok) {
        setError(r.error.message ?? r.error.code);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog open onClose={() => !isPending && onClose()} size="md">
      <DialogTitle>Restore &ldquo;{term.term_en}&rdquo;?</DialogTitle>
      <DialogDescription>
        Restored terms are immediately available for the next SOP translation.
      </DialogDescription>

      <DialogBody>
        {error && (
          <p
            role="alert"
            className="rounded-md border border-[color:var(--dc-edge)] bg-(--color-signal-urgent)/5 px-3 py-2 text-sm text-(--color-signal-urgent)"
          >
            {error}
          </p>
        )}
      </DialogBody>

      <DialogActions>
        <Button plain onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button color="brand" onClick={restore} disabled={isPending}>
          {isPending ? "Restoring…" : "Restore term"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
