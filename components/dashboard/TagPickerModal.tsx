"use client";

import { Lock, Plus, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from "@/components/ui/dialog";
import { TAG_COLORS, TAG_NAME_MAX, type Tag } from "@/lib/types/tags";

import { createTag } from "@/app/dashboard/tags/_actions/tags";
import { suggestTranslation } from "@/app/dashboard/glossary/_actions/glossary";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  allTags: Tag[];
  currentTagIds: string[];
  onSave: (tagIds: string[]) => Promise<{ ok: boolean; error?: { message?: string; code?: string } }>;
}

interface NewTagDraft {
  name_en: string;
  name_es: string;
  color: string;
}

const EMPTY_DRAFT: NewTagDraft = { name_en: "", name_es: "", color: TAG_COLORS[5] }; // default blue

const inputBase =
  "w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

const labelBase = "block text-xs font-medium text-dc-text-2 mb-1";

/**
 * Shared tag picker dialog used by glossary term and SOP tag management.
 * Lists all company tags with checkboxes, a search filter, and an inline
 * "New tag" form for creating custom tags.
 *
 * Department tags (source = 'department') show a lock badge and cannot
 * be deleted from within this modal.
 */
export function TagPickerModal({
  open,
  onClose,
  title,
  allTags: initialTags,
  currentTagIds,
  onSave,
}: Props) {
  const router = useRouter();

  const [tagPool, setTagPool] = useState<Tag[]>(() => initialTags.filter((t) => !t.archived_at));
  const [selected, setSelected] = useState<Set<string>>(new Set(currentTagIds));
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState<NewTagDraft>(EMPTY_DRAFT);
  const [translatePending, setTranslatePending] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, startSaveTransition] = useTransition();
  const [isCreating, startCreateTransition] = useTransition();

  // Sync state when the modal opens with new props.
  useEffect(() => {
    if (open) {
      setTagPool(initialTags.filter((t) => !t.archived_at));
      setSelected(new Set(currentTagIds));
      setQuery("");
      setShowCreate(false);
      setDraft(EMPTY_DRAFT);
      setCreateError(null);
      setSaveError(null);
    }
  }, [open, initialTags, currentTagIds]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSave() {
    setSaveError(null);
    startSaveTransition(async () => {
      const r = await onSave(Array.from(selected));
      if (!r.ok) {
        setSaveError(r.error?.message ?? r.error?.code ?? "Failed to save tags.");
        return;
      }
      onClose();
      router.refresh();
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name_en.trim() || !draft.name_es.trim()) return;
    setCreateError(null);
    startCreateTransition(async () => {
      const r = await createTag(draft);
      if (!r.ok) {
        setCreateError(r.error.message ?? r.error.code);
        return;
      }
      const newTag = r.data;
      setTagPool((prev) => [...prev, newTag]);
      setSelected((prev) => new Set([...prev, newTag.id]));
      setDraft(EMPTY_DRAFT);
      setShowCreate(false);
    });
  }

  function handleTranslateName() {
    if (!draft.name_en.trim()) return;
    setTranslatePending(true);
    suggestTranslation({ text: draft.name_en.trim(), excludeTermLower: null }).then((r) => {
      setTranslatePending(false);
      if (r.ok) setDraft((prev) => ({ ...prev, name_es: r.data.translated }));
    });
  }

  const lowerQuery = query.toLowerCase();
  const filtered = tagPool.filter(
    (t) =>
      t.name_en.toLowerCase().includes(lowerQuery) ||
      t.name_es.toLowerCase().includes(lowerQuery),
  );

  // Department tags first, then custom alphabetically.
  const sorted = [
    ...filtered.filter((t) => t.source === "department").sort((a, b) => a.name_en.localeCompare(b.name_en)),
    ...filtered.filter((t) => t.source === "custom").sort((a, b) => a.name_en.localeCompare(b.name_en)),
  ];

  return (
    <Dialog open={open} onClose={() => !isSaving && onClose()} size="xl">
      <DialogTitle>{title}</DialogTitle>

      <DialogBody className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-dc-text-3"
            strokeWidth={1.75}
            aria-hidden
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search labels…"
            className="w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised py-2 pl-9 pr-3 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
            aria-label="Search labels"
          />
        </div>

        {/* Tag list */}
        <div
          className="max-h-56 overflow-y-auto rounded-md border border-[color:var(--dc-edge)] bg-dc-raised"
          role="listbox"
          aria-multiselectable="true"
          aria-label="Available labels"
        >
          {sorted.length === 0 ? (
            <p className="py-6 text-center text-sm text-dc-text-3">
              {query ? "No labels match that search." : "No labels yet. Create one below."}
            </p>
          ) : (
            <ul className="divide-y divide-[color:var(--dc-edge)]">
              {sorted.map((tag) => {
                const checked = selected.has(tag.id);
                return (
                  <li key={tag.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={checked}
                      onClick={() => toggle(tag.id)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-dc-overlay"
                    >
                      {/* Color swatch */}
                      <span
                        className="size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: tag.color }}
                        aria-hidden
                      />
                      {/* Names */}
                      <span className="flex-1 min-w-0">
                        <span lang="en" className="font-medium text-dc-text">{tag.name_en}</span>
                        <span className="mx-1.5 text-dc-text-3">·</span>
                        <span lang="es" className="text-dc-text-2">{tag.name_es}</span>
                      </span>
                      {/* Dept lock badge */}
                      {tag.source === "department" && (
                        <span
                          className="ml-auto flex shrink-0 items-center gap-1 rounded bg-dc-overlay px-1.5 py-0.5 text-[10px] font-medium text-dc-text-3"
                          title="Department label — cannot be deleted"
                        >
                          <Lock className="size-2.5" strokeWidth={2} aria-hidden />
                          Dept
                        </span>
                      )}
                      {/* Checkbox indicator */}
                      <span
                        className={`ml-1 flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${
                          checked
                            ? "border-(--color-brand) bg-(--color-brand) text-white"
                            : "border-[color:var(--dc-edge)] bg-dc-surface"
                        }`}
                        aria-hidden
                      >
                        {checked && (
                          <svg viewBox="0 0 10 8" className="size-2.5" fill="currentColor">
                            <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Create new tag */}
        {showCreate ? (
          <form onSubmit={handleCreate} className="rounded-md border border-[color:var(--dc-edge)] bg-dc-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-dc-text">New label</span>
              <button
                type="button"
                onClick={() => { setShowCreate(false); setDraft(EMPTY_DRAFT); setCreateError(null); }}
                className="text-dc-text-3 hover:text-dc-text transition-colors"
                aria-label="Cancel new label"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelBase} lang="en">
                  English name <span className="text-(--color-signal-urgent)">*</span>
                </label>
                <input
                  type="text"
                  value={draft.name_en}
                  onChange={(e) => setDraft((p) => ({ ...p, name_en: e.target.value }))}
                  maxLength={TAG_NAME_MAX}
                  placeholder="e.g. Forklift Zone"
                  required
                  lang="en"
                  className={inputBase}
                  disabled={isCreating}
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label className="block text-xs font-medium text-dc-text-2" lang="es">
                    Spanish name <span className="text-(--color-signal-urgent)">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleTranslateName}
                    disabled={!draft.name_en.trim() || translatePending || isCreating}
                    className="inline-flex items-center gap-1 rounded border border-(--color-brand)/40 bg-(--color-brand)/5 px-2 py-0.5 text-[11px] font-medium text-(--color-brand) transition-colors hover:bg-(--color-brand)/15 disabled:cursor-not-allowed disabled:border-[color:var(--dc-edge)] disabled:bg-transparent disabled:text-dc-text-3"
                  >
                    {translatePending ? "Translating…" : draft.name_es ? "Re-translate" : "Translate"}
                  </button>
                </div>
                <input
                  type="text"
                  value={draft.name_es}
                  onChange={(e) => setDraft((p) => ({ ...p, name_es: e.target.value }))}
                  maxLength={TAG_NAME_MAX}
                  placeholder="p. ej. Zona de Montacargas"
                  required
                  lang="es"
                  className={inputBase}
                  disabled={isCreating}
                />
              </div>
            </div>

            {/* Color picker */}
            <div className="mt-3">
              <span className={labelBase}>Color</span>
              <div className="flex flex-wrap gap-2">
                {TAG_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, color: c }))}
                    disabled={isCreating}
                    aria-label={`Select color ${c}`}
                    aria-pressed={draft.color === c}
                    className={`size-6 rounded-full transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-brand) ${
                      draft.color === c ? "ring-2 ring-offset-2 ring-(--color-brand)" : ""
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {createError && (
              <p role="alert" className="mt-3 text-sm text-(--color-signal-urgent)">
                {createError}
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowCreate(false); setDraft(EMPTY_DRAFT); setCreateError(null); }}
                className="rounded-md px-3 py-1.5 text-sm text-dc-text-2 hover:text-dc-text transition-colors"
                disabled={isCreating}
              >
                Cancel
              </button>
              <Button
                type="submit"
                color="brand"
                disabled={isCreating || !draft.name_en.trim() || !draft.name_es.trim()}
              >
                {isCreating ? "Creating…" : "Create label"}
              </Button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-md border border-dashed border-[color:var(--dc-edge)] px-3 py-2.5 text-sm text-dc-text-2 transition-colors hover:border-(--color-brand)/40 hover:text-(--color-brand)"
          >
            <Plus className="size-4" strokeWidth={2} aria-hidden />
            New label
          </button>
        )}

        {saveError && (
          <p role="alert" className="text-sm text-(--color-signal-urgent)">
            {saveError}
          </p>
        )}
      </DialogBody>

      <DialogActions>
        <Button plain type="button" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button color="brand" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving…" : "Save labels"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
