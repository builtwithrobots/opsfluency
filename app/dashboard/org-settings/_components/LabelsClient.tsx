"use client";

import {
  Archive,
  ArchiveRestore,
  Check,
  ChevronDown,
  Lock,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  archiveTag,
  createTag,
  deleteTag,
  restoreTag,
  updateTag,
} from "@/app/dashboard/tags/_actions/tags";
import { suggestTranslation } from "@/app/dashboard/glossary/_actions/glossary";
import { Button } from "@/components/ui/button";
import { TAG_COLORS, TAG_NAME_MAX, type TagWithUsage } from "@/lib/types/tags";

const inputBase =
  "w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none disabled:opacity-50";

const labelBase = "block text-xs font-medium text-dc-text-2 mb-1";

type Draft = { name_en: string; name_es: string; color: string };
const EMPTY_DRAFT: Draft = { name_en: "", name_es: "", color: TAG_COLORS[5] };

export function LabelsClient({ tags }: { tags: TagWithUsage[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY_DRAFT);
  const [showCreate, setShowCreate] = useState(false);
  const [createDraft, setCreateDraft] = useState<Draft>(EMPTY_DRAFT);
  const [showArchived, setShowArchived] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});
  const [createError, setCreateError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [translatePending, setTranslatePending] = useState<"edit" | "create" | null>(null);

  const lowerQ = query.toLowerCase();
  const filtered = tags.filter(
    (t) =>
      !lowerQ ||
      t.name_en.toLowerCase().includes(lowerQ) ||
      t.name_es.toLowerCase().includes(lowerQ),
  );
  const active = filtered.filter((t) => !t.archived_at);
  const archived = filtered.filter((t) => t.archived_at);

  function startEdit(tag: TagWithUsage) {
    setEditingId(tag.id);
    setEditDraft({ name_en: tag.name_en, name_es: tag.name_es, color: tag.color });
    setRowError((p) => ({ ...p, [tag.id]: "" }));
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function setTagError(id: string, msg: string) {
    setRowError((p) => ({ ...p, [id]: msg }));
  }

  function handleSaveEdit(id: string) {
    setTagError(id, "");
    startTransition(async () => {
      const r = await updateTag({ id, ...editDraft });
      if (!r.ok) {
        setTagError(id, r.error.message ?? r.error.code);
        return;
      }
      setEditingId(null);
      router.refresh();
    });
  }

  function handleArchive(id: string) {
    startTransition(async () => {
      const r = await archiveTag({ id });
      if (!r.ok) setTagError(id, r.error.message ?? r.error.code);
      else router.refresh();
    });
  }

  function handleRestore(id: string) {
    startTransition(async () => {
      const r = await restoreTag({ id });
      if (!r.ok) setTagError(id, r.error.message ?? r.error.code);
      else router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const r = await deleteTag({ id });
      if (!r.ok) {
        setTagError(id, r.error.message ?? r.error.code);
        setDeleteConfirmId(null);
        return;
      }
      setDeleteConfirmId(null);
      router.refresh();
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    startTransition(async () => {
      const r = await createTag(createDraft);
      if (!r.ok) {
        setCreateError(r.error.message ?? r.error.code);
        return;
      }
      setCreateDraft(EMPTY_DRAFT);
      setShowCreate(false);
      router.refresh();
    });
  }

  async function translateDraft(target: "edit" | "create") {
    const text = target === "edit" ? editDraft.name_en : createDraft.name_en;
    if (!text.trim()) return;
    setTranslatePending(target);
    const r = await suggestTranslation({ text: text.trim(), excludeTermLower: null });
    setTranslatePending(null);
    if (r.ok) {
      if (target === "edit") setEditDraft((p) => ({ ...p, name_es: r.data.translated }));
      else setCreateDraft((p) => ({ ...p, name_es: r.data.translated }));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Search + Create button */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
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
            aria-label="Search labels"
            className="w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised py-2 pl-9 pr-3 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
          />
        </div>
        {!showCreate && (
          <Button
            type="button"
            color="brand"
            onClick={() => { setShowCreate(true); setCreateError(null); setCreateDraft(EMPTY_DRAFT); }}
          >
            <Plus className="size-4" strokeWidth={2} aria-hidden />
            New label
          </Button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-(--color-brand)/20 bg-dc-surface p-5 shadow-(--shadow-card)"
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-dc-text">New label</span>
            <button
              type="button"
              onClick={() => { setShowCreate(false); setCreateDraft(EMPTY_DRAFT); setCreateError(null); }}
              className="rounded-md p-1 text-dc-text-3 hover:text-dc-text transition-colors"
              aria-label="Cancel"
            >
              <X className="size-4" strokeWidth={2} />
            </button>
          </div>
          <DraftFields
            draft={createDraft}
            setDraft={setCreateDraft}
            onTranslate={() => translateDraft("create")}
            translatePending={translatePending === "create"}
            disabled={isPending}
          />
          {createError && (
            <p role="alert" className="mt-3 text-sm text-(--color-signal-urgent)">{createError}</p>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowCreate(false); setCreateDraft(EMPTY_DRAFT); setCreateError(null); }}
              className="rounded-md px-3 py-1.5 text-sm text-dc-text-2 hover:text-dc-text transition-colors"
              disabled={isPending}
            >
              Cancel
            </button>
            <Button
              type="submit"
              color="brand"
              disabled={isPending || !createDraft.name_en.trim() || !createDraft.name_es.trim()}
            >
              {isPending ? "Creating…" : "Create label"}
            </Button>
          </div>
        </form>
      )}

      {/* Active labels */}
      <section>
        <div className="mb-2 flex items-center gap-2">
          <h3 className="text-xs font-semibold tracking-[0.08em] uppercase text-dc-text-3">
            Active
          </h3>
          <span className="rounded-full bg-dc-raised px-2 py-0.5 text-xs font-medium text-dc-text-3">
            {active.length}
          </span>
        </div>
        <div className="divide-y divide-[color:var(--dc-edge)] rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface overflow-hidden">
          {active.length === 0 ? (
            <p className="py-8 text-center text-sm text-dc-text-3">
              {query ? "No active labels match." : "No custom labels yet."}
            </p>
          ) : (
            active.map((tag) => (
              <TagRow
                key={tag.id}
                tag={tag}
                editingId={editingId}
                editDraft={editDraft}
                setEditDraft={setEditDraft}
                onStartEdit={() => startEdit(tag)}
                onCancelEdit={cancelEdit}
                onSaveEdit={() => handleSaveEdit(tag.id)}
                onArchive={() => handleArchive(tag.id)}
                onRestore={() => handleRestore(tag.id)}
                onDeleteRequest={() => setDeleteConfirmId(tag.id)}
                onDeleteConfirm={() => handleDelete(tag.id)}
                onDeleteCancel={() => setDeleteConfirmId(null)}
                deleteConfirmId={deleteConfirmId}
                error={rowError[tag.id]}
                isPending={isPending}
                translatePending={translatePending === "edit"}
                onTranslate={() => translateDraft("edit")}
              />
            ))
          )}
        </div>
      </section>

      {/* Archived labels */}
      {archived.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-[0.08em] uppercase text-dc-text-3 hover:text-dc-text transition-colors"
          >
            <span>Archived</span>
            <span className="rounded-full bg-dc-raised px-2 py-0.5 font-medium normal-case tracking-normal">
              {archived.length}
            </span>
            <ChevronDown
              className={`size-3.5 transition-transform ${showArchived ? "rotate-180" : ""}`}
              strokeWidth={2}
            />
          </button>
          {showArchived && (
            <div className="divide-y divide-[color:var(--dc-edge)] rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface overflow-hidden opacity-80">
              {archived.map((tag) => (
                <TagRow
                  key={tag.id}
                  tag={tag}
                  editingId={editingId}
                  editDraft={editDraft}
                  setEditDraft={setEditDraft}
                  onStartEdit={() => startEdit(tag)}
                  onCancelEdit={cancelEdit}
                  onSaveEdit={() => handleSaveEdit(tag.id)}
                  onArchive={() => handleArchive(tag.id)}
                  onRestore={() => handleRestore(tag.id)}
                  onDeleteRequest={() => setDeleteConfirmId(tag.id)}
                  onDeleteConfirm={() => handleDelete(tag.id)}
                  onDeleteCancel={() => setDeleteConfirmId(null)}
                  deleteConfirmId={deleteConfirmId}
                  error={rowError[tag.id]}
                  isPending={isPending}
                  translatePending={translatePending === "edit"}
                  onTranslate={() => translateDraft("edit")}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// ── TagRow ────────────────────────────────────────────────────────────────────

interface TagRowProps {
  tag: TagWithUsage;
  editingId: string | null;
  editDraft: Draft;
  setEditDraft: React.Dispatch<React.SetStateAction<Draft>>;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  deleteConfirmId: string | null;
  error?: string;
  isPending: boolean;
  translatePending: boolean;
  onTranslate: () => void;
}

function TagRow({
  tag,
  editingId,
  editDraft,
  setEditDraft,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onArchive,
  onRestore,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  deleteConfirmId,
  error,
  isPending,
  translatePending,
  onTranslate,
}: TagRowProps) {
  const isEditing = editingId === tag.id;
  const isConfirmingDelete = deleteConfirmId === tag.id;
  const isArchived = !!tag.archived_at;
  const isDept = tag.source === "department";
  const usage = tag.sop_count + tag.term_count;
  const canDelete = usage === 0 && !isDept;

  if (isEditing) {
    return (
      <div className="p-4">
        <DraftFields
          draft={editDraft}
          setDraft={setEditDraft}
          onTranslate={onTranslate}
          translatePending={translatePending}
          disabled={isPending}
        />
        {error && (
          <p role="alert" className="mt-2 text-sm text-(--color-signal-urgent)">{error}</p>
        )}
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancelEdit}
            disabled={isPending}
            className="rounded-md px-3 py-1.5 text-sm text-dc-text-2 hover:text-dc-text transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <Button
            type="button"
            color="brand"
            onClick={onSaveEdit}
            disabled={isPending || !editDraft.name_en.trim() || !editDraft.name_es.trim()}
          >
            <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    );
  }

  if (isConfirmingDelete) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-(--color-signal-urgent)/5">
        <span
          className="size-3 shrink-0 rounded-full"
          style={{ backgroundColor: tag.color }}
          aria-hidden
        />
        <span className="flex-1 text-sm text-dc-text">
          <span lang="en" className="font-medium">{tag.name_en}</span>
          <span className="mx-1.5 text-dc-text-3">·</span>
          <span lang="es" className="text-dc-text-2">{tag.name_es}</span>
        </span>
        <span className="text-sm text-dc-text-2">Permanently delete this label?</span>
        <button
          type="button"
          onClick={onDeleteCancel}
          disabled={isPending}
          className="rounded-md px-3 py-1.5 text-sm text-dc-text-2 hover:text-dc-text transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onDeleteConfirm}
          disabled={isPending}
          className="rounded-md bg-(--color-signal-urgent)/10 px-3 py-1.5 text-sm font-medium text-(--color-signal-urgent) hover:bg-(--color-signal-urgent)/20 transition-colors disabled:opacity-50"
        >
          {isPending ? "Deleting…" : "Delete"}
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-3 px-4 py-3">
      {/* Color swatch */}
      <span
        className="size-3 shrink-0 rounded-full"
        style={{ backgroundColor: tag.color }}
        aria-hidden
      />

      {/* Names */}
      <span className="flex min-w-0 flex-1 items-baseline gap-1.5 truncate">
        <span lang="en" className="text-sm font-medium text-dc-text">{tag.name_en}</span>
        <span className="text-dc-text-3 text-xs">·</span>
        <span lang="es" className="text-sm text-dc-text-2">{tag.name_es}</span>
      </span>

      {/* Source badge */}
      {isDept ? (
        <span
          className="flex shrink-0 items-center gap-1 rounded bg-dc-overlay px-1.5 py-0.5 text-[10px] font-medium text-dc-text-3"
          title="Department label — system managed"
        >
          <Lock className="size-2.5" strokeWidth={2} aria-hidden />
          Dept
        </span>
      ) : (
        <span className="shrink-0 rounded bg-dc-overlay px-1.5 py-0.5 text-[10px] font-medium text-dc-text-3">
          Custom
        </span>
      )}

      {/* Usage count */}
      <span className="w-24 shrink-0 text-right text-xs text-dc-text-3">
        {usage === 0 ? (
          <span className="text-dc-text-3">Unused</span>
        ) : (
          <>
            {tag.sop_count > 0 && (
              <span>{tag.sop_count} SOP{tag.sop_count !== 1 ? "s" : ""}</span>
            )}
            {tag.sop_count > 0 && tag.term_count > 0 && (
              <span className="mx-1">·</span>
            )}
            {tag.term_count > 0 && (
              <span>{tag.term_count} term{tag.term_count !== 1 ? "s" : ""}</span>
            )}
          </>
        )}
      </span>

      {/* Actions */}
      {!isDept && (
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {!isArchived && (
            <IconButton
              label="Edit label"
              onClick={onStartEdit}
              disabled={isPending}
            >
              <Pencil className="size-3.5" strokeWidth={1.75} />
            </IconButton>
          )}
          {isArchived ? (
            <IconButton label="Restore label" onClick={onRestore} disabled={isPending}>
              <ArchiveRestore className="size-3.5" strokeWidth={1.75} />
            </IconButton>
          ) : (
            <IconButton label="Archive label" onClick={onArchive} disabled={isPending}>
              <Archive className="size-3.5" strokeWidth={1.75} />
            </IconButton>
          )}
          {canDelete && (
            <IconButton
              label="Delete label"
              onClick={onDeleteRequest}
              disabled={isPending}
              danger
            >
              <Trash2 className="size-3.5" strokeWidth={1.75} />
            </IconButton>
          )}
        </div>
      )}

      {/* Per-row error (shown below, shifts layout) */}
      {error && (
        <p role="alert" className="absolute mt-8 text-xs text-(--color-signal-urgent)">{error}</p>
      )}
    </div>
  );
}

// ── DraftFields ───────────────────────────────────────────────────────────────

function DraftFields({
  draft,
  setDraft,
  onTranslate,
  translatePending,
  disabled,
}: {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  onTranslate: () => void;
  translatePending: boolean;
  disabled: boolean;
}) {
  return (
    <div className="space-y-3">
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
            disabled={disabled}
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className="block text-xs font-medium text-dc-text-2" lang="es">
              Spanish name <span className="text-(--color-signal-urgent)">*</span>
            </label>
            <button
              type="button"
              onClick={onTranslate}
              disabled={!draft.name_en.trim() || translatePending || disabled}
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
            disabled={disabled}
          />
        </div>
      </div>

      {/* Color picker */}
      <div>
        <span className={labelBase}>Color</span>
        <div className="flex flex-wrap gap-2">
          {TAG_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setDraft((p) => ({ ...p, color: c }))}
              disabled={disabled}
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
    </div>
  );
}

// ── IconButton ────────────────────────────────────────────────────────────────

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`flex size-7 items-center justify-center rounded-md transition-colors disabled:opacity-40 ${
        danger
          ? "text-dc-text-3 hover:bg-(--color-signal-urgent)/10 hover:text-(--color-signal-urgent)"
          : "text-dc-text-3 hover:bg-dc-raised hover:text-dc-text"
      }`}
    >
      {children}
    </button>
  );
}
