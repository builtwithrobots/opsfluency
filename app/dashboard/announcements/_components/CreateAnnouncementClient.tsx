"use client";

import { useState, useTransition } from "react";
import { PlusCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { createAnnouncement } from "@/app/dashboard/announcements/_actions";
import { Button } from "@/components/ui/button";
import {
  ANNOUNCEMENT_BODY_MAX,
  ANNOUNCEMENT_TITLE_MAX,
} from "@/lib/types/announcements";

interface DeptOption {
  id: string;
  name: string;
}

interface Props {
  departments: DeptOption[];
  canPostOrgWide: boolean;
}

const inputClass =
  "w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

const labelClass =
  "block text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase mb-1.5";

export function CreateAnnouncementClient({ departments, canPostOrgWide }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [deptId, setDeptId] = useState<string | null>(canPostOrgWide ? null : (departments[0]?.id ?? null));
  const [priority, setPriority] = useState<"normal" | "urgent">("normal");
  const [pinned, setPinned] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setTitle("");
    setBody("");
    setDeptId(canPostOrgWide ? null : (departments[0]?.id ?? null));
    setPriority("normal");
    setPinned(false);
    setExpiresAt("");
    setError(null);
  }

  function handleClose() {
    reset();
    setOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createAnnouncement({
        title_en: title,
        body_en: body,
        department_id: deptId,
        priority,
        pinned,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      });

      if (!result.ok) {
        setError(result.error.message ?? "Something went wrong. Please try again.");
        return;
      }

      reset();
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} color="dark">
        <PlusCircle data-slot="icon" />
        New Announcement
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-dc-text">New Announcement</h3>
        <button
          type="button"
          onClick={handleClose}
          className="rounded-md p-1 text-dc-text-3 hover:bg-dc-raised hover:text-dc-text"
          aria-label="Cancel"
        >
          <X className="size-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Title */}
        <div>
          <label htmlFor="ann-title" className={labelClass}>
            Title (English)
          </label>
          <input
            id="ann-title"
            type="text"
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={ANNOUNCEMENT_TITLE_MAX}
            placeholder="e.g. Forklift aisle closed until 3 PM"
            required
            disabled={isPending}
          />
          <p className="mt-1 text-right text-xs text-dc-text-3">
            {title.length}/{ANNOUNCEMENT_TITLE_MAX}
          </p>
        </div>

        {/* Body */}
        <div>
          <label htmlFor="ann-body" className={labelClass}>
            Message (English)
          </label>
          <textarea
            id="ann-body"
            className={`${inputClass} min-h-[100px] resize-y`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={ANNOUNCEMENT_BODY_MAX}
            placeholder="Details about the announcement…"
            required
            disabled={isPending}
          />
          <p className="mt-1 text-right text-xs text-dc-text-3">
            {body.length}/{ANNOUNCEMENT_BODY_MAX}
          </p>
        </div>

        <p className="rounded-md bg-(--color-brand)/10 px-3 py-2 text-xs text-(--color-brand)">
          Spanish translation is generated automatically from your company&apos;s glossary.
        </p>

        {/* Department */}
        <div>
          <label htmlFor="ann-dept" className={labelClass}>
            Audience
          </label>
          <select
            id="ann-dept"
            className={inputClass}
            value={deptId ?? ""}
            onChange={(e) => setDeptId(e.target.value === "" ? null : e.target.value)}
            disabled={isPending}
          >
            {canPostOrgWide && <option value="">All Teams (org-wide)</option>}
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Priority + Pinned */}
        <div className="flex flex-wrap gap-4">
          <div>
            <span className={labelClass}>Priority</span>
            <div className="flex gap-2">
              {(["normal", "urgent"] as const).map((p) => (
                <label
                  key={p}
                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm capitalize transition-colors ${
                    priority === p
                      ? p === "urgent"
                        ? "border-red-500 bg-red-500/10 text-red-500"
                        : "border-(--color-brand) bg-(--color-brand)/10 text-(--color-brand)"
                      : "border-[color:var(--dc-edge)] text-dc-text-2 hover:bg-dc-raised"
                  }`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={p}
                    checked={priority === p}
                    onChange={() => setPriority(p)}
                    className="sr-only"
                    disabled={isPending}
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>

          <div>
            <span className={labelClass}>Pin to top</span>
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-[color:var(--dc-edge)] px-3 py-2 text-sm text-dc-text-2 hover:bg-dc-raised has-[:checked]:border-(--color-brand) has-[:checked]:bg-(--color-brand)/10 has-[:checked]:text-(--color-brand)">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                disabled={isPending}
                className="size-4 accent-(--color-brand)"
              />
              Pinned
            </label>
          </div>
        </div>

        {/* Expiry */}
        <div>
          <label htmlFor="ann-expires" className={labelClass}>
            Expires (optional)
          </label>
          <input
            id="ann-expires"
            type="datetime-local"
            className={inputClass}
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            disabled={isPending}
          />
          <p className="mt-1 text-xs text-dc-text-3">
            Leave blank to keep the announcement visible indefinitely.
          </p>
        </div>

        {error && (
          <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button plain onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            color="dark"
            disabled={isPending || !title.trim() || !body.trim()}
          >
            {isPending ? "Posting…" : "Post Announcement"}
          </Button>
        </div>
      </form>
    </div>
  );
}
