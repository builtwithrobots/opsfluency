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
import { useEffect, useRef, useState, useTransition } from "react";

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

type Draft = { name_en: string; name_es: string; color: string };
const EMPTY_DRAFT: Draft = { name_en: "", name_es: "", color: TAG_COLORS[5] };

// ── Color picker popover ──────────────────────────────────────────────────────

function ColorPickerDropdown({
  color,
  onChange,
  disabled,
}: {
  color: string;
  onChange: (c: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-label="Choose color"
        className="flex items-center gap-1 rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-2 py-1.5 transition-colors hover:border-(--color-brand)/40 disabled:opacity-50"
      >
        <span
          className="size-4 rounded-full shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <ChevronDown
          className={`size-3 text-dc-text-3 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
          aria-hidden
        />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 grid grid-cols-4 gap-1.5 rounded-lg border border-[color:var(--dc-edge)] bg-dc-surface p-2.5 shadow-(--shadow-float)">
          {TAG_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Select color ${c}`}
              aria-pressed={color === c}
              onClick={() => { onChange(c); setOpen(false); }}
              className={`size-6 rounded-full transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-brand) ${
                color === c ? "ring-2 ring-offset-2 ring-(--color-brand)" : ""
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Translate button ──────────────────────────────────────────────────────────

function TranslateButton({
  onClick,
  pending,
  hasValue,
  disabled,
}: {
  onClick: () => void;
  pending: boolean;
  hasValue: boolean;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || pending}
      className="shrink-0 inline-flex items-center gap-1 rounded border border-(--color-brand)/40 bg-(--color-brand)/5 px-2 py-1 text-[11px] font-medium text-(--color-brand) transition-colors hover:bg-(--color-brand)/15 disabled:cursor-not-allowed disabled:border-[color:var(--dc-edge)] disabled:bg-transparent disabled:text-dc-text-3"
    >
      {pending ? "Translating…" : hasValue ? "Re-translate" : "Translate"}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function LabelsClient({ tags }: { tags: TagWithUsage[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY_DRAFT);
  const [showCreate, setShowCreate] = useState(false);
  const [createDraft, setCreateDraft] = useState<Draft>(EMPTY_DRAFT);
  const [showArchived, setShowArchived] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createError, setCreateError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [translateTarget, setTranslateTarget] = useState<"edit" | "create" | null>(null);

  const lowerQ = query.toLowerCase();
  const filtered = lowerQ
    ? tags.filter(
        (t) =>
          t.name_en.toLowerCase().includes(lowerQ) ||
          t.name_es.toLowerCase().includes(lowerQ),
      )
    : tags;
  const active = filtered.filter((t) => !t.archived_at);
  const archived = filtered.filter((t) => t.archived_at);

  function setErr(id: string, msg: string) {
    setErrors((p) => ({ ...p, [id]: msg }));
  }

  function startEdit(tag: TagWithUsage) {
    setEditingId(tag.id);
    setEditDraft({ name_en: tag.name_en, name_es: tag.name_es, color: tag.color });
    setErrors((p) => ({ ...p, [tag.id]: "" }));
  }

  function handleSaveEdit(id: string) {
    setErr(id, "");
    startTransition(async () => {
      const r = await updateTag({ id, ...editDraft });
      if (!r.ok) { setErr(id, r.error.message ?? r.error.code); return; }
      setEditingId(null);
      router.refresh();
    });
  }

  function handleArchive(id: string) {
    startTransition(async () => {
      const r = await archiveTag({ id });
      if (!r.ok) setErr(id, r.error.message ?? r.error.code);
      else router.refresh();
    });
  }

  function handleRestore(id: string) {
    startTransition(async () => {
      const r = await restoreTag({ id });
      if (!r.ok) setErr(id, r.error.message ?? r.error.code);
      else router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const r = await deleteTag({ id });
      if (!r.ok) { setErr(id, r.error.message ?? r.error.code); setDeleteConfirmId(null); return; }
      setDeleteConfirmId(null);
      router.refresh();
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    startTransition(async () => {
      const r = await createTag(createDraft);
      if (!r.ok) { setCreateError(r.error.message ?? r.error.code); return; }
      setCreateDraft(EMPTY_DRAFT);
      setShowCreate(false);
      router.refresh();
    });
  }

  async function handleTranslate(target: "edit" | "create") {
    const text = target === "edit" ? editDraft.name_en : createDraft.name_en;
    if (!text.trim()) return;
    setTranslateTarget(target);
    const r = await suggestTranslation({ text: text.trim(), excludeTermLower: null });
    setTranslateTarget(null);
    if (r.ok) {
      if (target === "edit") setEditDraft((p) => ({ ...p, name_es: r.data.translated }));
      else setCreateDraft((p) => ({ ...p, name_es: r.data.translated }));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
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
              onClick={() => { setShowCreate(false); setCreateError(null); }}
              className="rounded-md p-1 text-dc-text-3 hover:text-dc-text transition-colors"
              aria-label="Cancel"
            >
              <X className="size-4" strokeWidth={2} />
            </button>
          </div>
          <div className="flex items-end gap-3">
            <ColorPickerDropdown
              color={createDraft.color}
              onChange={(c) => setCreateDraft((p) => ({ ...p, color: c }))}
              disabled={isPending}
            />
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-dc-text-2 mb-1" lang="en">
                  English <span className="text-(--color-signal-urgent)">*</span>
                </label>
                <input
                  type="text"
                  value={createDraft.name_en}
                  onChange={(e) => setCreateDraft((p) => ({ ...p, name_en: e.target.value }))}
                  maxLength={TAG_NAME_MAX}
                  placeholder="e.g. Forklift Zone"
                  required
                  lang="en"
                  className={inputBase}
                  disabled={isPending}
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-xs font-medium text-dc-text-2" lang="es">
                    Spanish <span className="text-(--color-signal-urgent)">*</span>
                  </label>
                  <TranslateButton
                    onClick={() => handleTranslate("create")}
                    pending={translateTarget === "create"}
                    hasValue={!!createDraft.name_es}
                    disabled={!createDraft.name_en.trim() || isPending}
                  />
                </div>
                <input
                  type="text"
                  value={createDraft.name_es}
                  onChange={(e) => setCreateDraft((p) => ({ ...p, name_es: e.target.value }))}
                  maxLength={TAG_NAME_MAX}
                  placeholder="p. ej. Zona de Montacargas"
                  required
                  lang="es"
                  className={inputBase}
                  disabled={isPending}
                />
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => { setShowCreate(false); setCreateError(null); }}
                disabled={isPending}
                className="rounded-md px-3 py-2 text-sm text-dc-text-2 hover:text-dc-text transition-colors"
              >
                Cancel
              </button>
              <Button
                type="submit"
                color="brand"
                disabled={isPending || !createDraft.name_en.trim() || !createDraft.name_es.trim()}
              >
                {isPending ? "Creating…" : "Create"}
              </Button>
            </div>
          </div>
          {createError && (
            <p role="alert" className="mt-3 text-sm text-(--color-signal-urgent)">{createError}</p>
          )}
        </form>
      )}

      {/* Active labels */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-xs font-semibold tracking-[0.08em] uppercase text-dc-text-3">Active</h3>
          <span className="rounded-full bg-dc-raised px-2 py-0.5 text-xs font-medium text-dc-text-3">
            {active.length}
          </span>
        </div>
        {active.length === 0 ? (
          <p className="text-sm text-dc-text-3">
            {query ? "No active labels match your search." : "No custom labels yet. Create one above."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {active.map((tag) => (
              <LabelCard
                key={tag.id}
                tag={tag}
                editingId={editingId}
                editDraft={editDraft}
                setEditDraft={setEditDraft}
                onStartEdit={() => startEdit(tag)}
                onCancelEdit={() => setEditingId(null)}
                onSaveEdit={() => handleSaveEdit(tag.id)}
                onArchive={() => handleArchive(tag.id)}
                onRestore={() => handleRestore(tag.id)}
                onDeleteRequest={() => setDeleteConfirmId(tag.id)}
                onDeleteConfirm={() => handleDelete(tag.id)}
                onDeleteCancel={() => setDeleteConfirmId(null)}
                deleteConfirmId={deleteConfirmId}
                error={errors[tag.id]}
                isPending={isPending}
                translatePending={translateTarget === "edit"}
                onTranslate={() => handleTranslate("edit")}
              />
            ))}
          </div>
        )}
      </section>

      {/* Archived labels */}
      {archived.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.08em] uppercase text-dc-text-3 hover:text-dc-text transition-colors"
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
            <div className="grid grid-cols-2 gap-3 opacity-75">
              {archived.map((tag) => (
                <LabelCard
                  key={tag.id}
                  tag={tag}
                  editingId={editingId}
                  editDraft={editDraft}
                  setEditDraft={setEditDraft}
                  onStartEdit={() => startEdit(tag)}
                  onCancelEdit={() => setEditingId(null)}
                  onSaveEdit={() => handleSaveEdit(tag.id)}
                  onArchive={() => handleArchive(tag.id)}
                  onRestore={() => handleRestore(tag.id)}
                  onDeleteRequest={() => setDeleteConfirmId(tag.id)}
                  onDeleteConfirm={() => handleDelete(tag.id)}
                  onDeleteCancel={() => setDeleteConfirmId(null)}
                  deleteConfirmId={deleteConfirmId}
                  error={errors[tag.id]}
                  isPending={isPending}
                  translatePending={translateTarget === "edit"}
                  onTranslate={() => handleTranslate("edit")}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// ── LabelCard ─────────────────────────────────────────────────────────────────

interface LabelCardProps {
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

function LabelCard({
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
}: LabelCardProps) {
  const isEditing = editingId === tag.id;
  const isConfirmingDelete = deleteConfirmId === tag.id;
  const isArchived = !!tag.archived_at;
  const isDept = tag.source === "department";
  const usage = tag.sop_count + tag.term_count;
  const canDelete = usage === 0 && !isDept;

  // ── Edit mode ──
  if (isEditing) {
    return (
      <div className="rounded-xl border border-(--color-brand)/30 bg-dc-surface p-4 shadow-(--shadow-card)">
        {/* Color + names row */}
        <div className="flex items-center gap-2 mb-3">
          <ColorPickerDropdown
            color={editDraft.color}
            onChange={(c) => setEditDraft((p) => ({ ...p, color: c }))}
            disabled={isPending}
          />
          <input
            type="text"
            value={editDraft.name_en}
            onChange={(e) => setEditDraft((p) => ({ ...p, name_en: e.target.value }))}
            maxLength={TAG_NAME_MAX}
            placeholder="English name"
            lang="en"
            className={inputBase}
            disabled={isPending}
            autoFocus
          />
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-[72px] shrink-0" aria-hidden /> {/* align with color picker */}
          <input
            type="text"
            value={editDraft.name_es}
            onChange={(e) => setEditDraft((p) => ({ ...p, name_es: e.target.value }))}
            maxLength={TAG_NAME_MAX}
            placeholder="Spanish name"
            lang="es"
            className={inputBase}
            disabled={isPending}
          />
          <TranslateButton
            onClick={onTranslate}
            pending={translatePending}
            hasValue={!!editDraft.name_es}
            disabled={!editDraft.name_en.trim() || isPending}
          />
        </div>
        {error && (
          <p role="alert" className="mb-2 text-xs text-(--color-signal-urgent)">{error}</p>
        )}
        <div className="flex justify-end gap-2">
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

  // ── Delete confirm mode ──
  if (isConfirmingDelete) {
    return (
      <div className="rounded-xl border border-(--color-signal-urgent)/30 bg-(--color-signal-urgent)/5 p-4">
        <p className="mb-3 text-sm font-medium text-dc-text">
          Delete <span style={{ color: tag.color }}>{tag.name_en}</span>?
        </p>
        <p className="mb-4 text-xs text-dc-text-3">This cannot be undone.</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onDeleteCancel}
            disabled={isPending}
            className="flex-1 rounded-md border border-[color:var(--dc-edge)] py-1.5 text-sm text-dc-text-2 hover:text-dc-text transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDeleteConfirm}
            disabled={isPending}
            className="flex-1 rounded-md bg-(--color-signal-urgent)/15 py-1.5 text-sm font-medium text-(--color-signal-urgent) hover:bg-(--color-signal-urgent)/25 transition-colors disabled:opacity-50"
          >
            {isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-2 text-xs text-(--color-signal-urgent)">{error}</p>
        )}
      </div>
    );
  }

  // ── Normal view mode ──
  return (
    <div className="group relative rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-4 shadow-(--shadow-card) transition-shadow hover:shadow-(--shadow-raised)">
      {/* Color + names */}
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 size-3.5 shrink-0 rounded-full"
          style={{ backgroundColor: tag.color }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-dc-text" lang="en">
            {tag.name_en}
          </p>
          <p className="mt-0.5 truncate text-sm text-dc-text-2" lang="es">
            {tag.name_es}
          </p>
        </div>

        {/* Source badge */}
        {isDept ? (
          <span
            className="flex shrink-0 items-center gap-1 rounded bg-dc-overlay px-1.5 py-0.5 text-[10px] font-medium text-dc-text-3"
            title="System-managed department label"
          >
            <Lock className="size-2.5" strokeWidth={2} aria-hidden />
            Dept
          </span>
        ) : (
          <span className="shrink-0 rounded bg-dc-overlay px-1.5 py-0.5 text-[10px] font-medium text-dc-text-3">
            Custom
          </span>
        )}
      </div>

      {/* Usage + actions footer */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-dc-text-3">
          {usage === 0 ? (
            "Unused"
          ) : (
            <>
              {tag.sop_count > 0 && `${tag.sop_count} SOP${tag.sop_count !== 1 ? "s" : ""}`}
              {tag.sop_count > 0 && tag.term_count > 0 && " · "}
              {tag.term_count > 0 && `${tag.term_count} term${tag.term_count !== 1 ? "s" : ""}`}
            </>
          )}
        </span>

        {!isDept && (
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            {!isArchived && (
              <IconBtn label="Edit" onClick={onStartEdit} disabled={isPending}>
                <Pencil className="size-3.5" strokeWidth={1.75} />
              </IconBtn>
            )}
            {isArchived ? (
              <IconBtn label="Restore" onClick={onRestore} disabled={isPending}>
                <ArchiveRestore className="size-3.5" strokeWidth={1.75} />
              </IconBtn>
            ) : (
              <IconBtn label="Archive" onClick={onArchive} disabled={isPending}>
                <Archive className="size-3.5" strokeWidth={1.75} />
              </IconBtn>
            )}
            {canDelete && (
              <IconBtn label="Delete" onClick={onDeleteRequest} disabled={isPending} danger>
                <Trash2 className="size-3.5" strokeWidth={1.75} />
              </IconBtn>
            )}
          </div>
        )}
      </div>

      {error && !isEditing && (
        <p role="alert" className="mt-2 text-xs text-(--color-signal-urgent)">{error}</p>
      )}
    </div>
  );
}

// ── IconBtn ───────────────────────────────────────────────────────────────────

function IconBtn({
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
