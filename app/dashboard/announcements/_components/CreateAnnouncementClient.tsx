"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

import { createAnnouncement } from "@/app/dashboard/announcements/_actions";
import { Button } from "@/components/ui/button";
import {
  ANNOUNCEMENT_BODY_MAX,
  ANNOUNCEMENT_TITLE_MAX,
  type AnnouncementWithMeta,
} from "@/lib/types/announcements";

interface DeptOption {
  id: string;
  name: string;
}

interface Props {
  departments: DeptOption[];
  canPostOrgWide: boolean;
  onCreated?: (ann: AnnouncementWithMeta) => void;
}

const inputClass =
  "w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

const labelClass =
  "block text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase mb-1.5";

const ORG_WIDE = "__org_wide__";

// Returns true for platforms that require a Google or Microsoft account to view.
function requiresAccountWarning(url: string): boolean {
  if (!url) return false;
  try {
    const h = new URL(url).hostname;
    return (
      h.includes("drive.google.com") ||
      h.includes("docs.google.com") ||
      h.includes("sharepoint.com") ||
      h.includes("onedrive.live.com") ||
      h.includes("microsoftstream.com")
    );
  } catch {
    return false;
  }
}

export function CreateAnnouncementClient({ departments, canPostOrgWide, onCreated }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  // Selected audience: either [ORG_WIDE] or a list of dept IDs
  const defaultSelected = canPostOrgWide
    ? [ORG_WIDE]
    : departments[0]
    ? [departments[0].id]
    : [];
  const [selected, setSelected] = useState<string[]>(defaultSelected);
  const [priority, setPriority] = useState<"normal" | "urgent">("normal");
  const [pinned, setPinned] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setTitle("");
    setBody("");
    setSelected(defaultSelected);
    setPriority("normal");
    setPinned(false);
    setExpiresAt("");
    setLinkUrl("");
    setError(null);
  }

  function toggleOption(value: string) {
    if (value === ORG_WIDE) {
      setSelected([ORG_WIDE]);
      return;
    }
    setSelected((prev) => {
      const without = prev.filter((v) => v !== ORG_WIDE);
      return without.includes(value)
        ? without.filter((v) => v !== value)
        : [...without, value];
    });
  }

  const isOrgWide = selected.includes(ORG_WIDE);
  const selectedDepts = isOrgWide
    ? []
    : departments.filter((d) => selected.includes(d.id));

  // Human-readable audience summary for the reminder
  const audienceSummary = isOrgWide
    ? "all teams"
    : selectedDepts.map((d) => d.name).join(", ");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.length === 0) return;
    setError(null);

    const targets: (string | null)[] = isOrgWide
      ? [null]
      : selectedDepts.map((d) => d.id);

    startTransition(async () => {
      const now = new Date().toISOString();
      const results = await Promise.all(
        targets.map((dept_id) =>
          createAnnouncement({
            title_en: title,
            body_en: body,
            department_id: dept_id,
            priority,
            pinned,
            expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
            link_url: linkUrl.trim() || null,
          }),
        ),
      );

      const failed = results.find((r) => !r.ok);
      if (failed && !failed.ok) {
        setError(failed.error.message ?? "Something went wrong. Please try again.");
        return;
      }

      // Optimistically push each new announcement into the feed immediately.
      // Spanish fields are filled in by the background router.refresh() below.
      if (onCreated) {
        results.forEach((result, i) => {
          if (!result.ok) return;
          const dept_id = targets[i];
          const dept = departments.find((d) => d.id === dept_id);
          onCreated({
            id: result.data.id,
            company_id: "",
            created_by: "",
            department_id: dept_id,
            department_name: dept?.name ?? null,
            title_en: title,
            title_es: "",
            body_en: body,
            body_es: "",
            priority,
            pinned,
            expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
            link_url: linkUrl.trim() || null,
            created_at: now,
            updated_at: now,
          });
        });
      }

      reset();
      // Refresh in background to fill in Spanish translations
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-(--shadow-card)">
      <div className="border-b border-[color:var(--dc-edge)] px-5 py-3.5">
        <h3 className="text-sm font-semibold text-dc-text">New Announcement</h3>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
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
            className={`${inputClass} min-h-[120px] resize-y`}
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

        {/* Audience checkboxes */}
        <fieldset>
          <legend className={labelClass}>Audience</legend>
          <div className="flex flex-col gap-1.5">
            {canPostOrgWide && (
              <label className={`flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2.5 text-sm transition-colors ${
                isOrgWide
                  ? "border-(--color-brand) bg-(--color-brand)/8 text-dc-text"
                  : "border-[color:var(--dc-edge)] text-dc-text-2 hover:bg-dc-raised"
              }`}>
                <input
                  type="checkbox"
                  checked={isOrgWide}
                  onChange={() => toggleOption(ORG_WIDE)}
                  disabled={isPending}
                  className="size-4 accent-(--color-brand) shrink-0"
                />
                <span className="font-medium">All Teams</span>
                <span className="ml-auto text-xs text-dc-text-3">org-wide</span>
              </label>
            )}
            {departments.map((dept) => (
              <label
                key={dept.id}
                className={`flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2.5 text-sm transition-colors ${
                  !isOrgWide && selected.includes(dept.id)
                    ? "border-(--color-brand) bg-(--color-brand)/8 text-dc-text"
                    : "border-[color:var(--dc-edge)] text-dc-text-2 hover:bg-dc-raised"
                } ${isPending ? "opacity-40 pointer-events-none" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={!isOrgWide && selected.includes(dept.id)}
                  onChange={() => toggleOption(dept.id)}
                  disabled={isPending}
                  className="size-4 accent-(--color-brand) shrink-0"
                />
                {dept.name}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Broadcast reminder */}
        {selected.length > 0 && (
          <div className="flex items-start gap-2 rounded-md border border-amber-400/30 bg-amber-400/8 px-3 py-2.5">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-500" strokeWidth={2} aria-hidden />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              This message will be broadcast to{" "}
              <span className="font-semibold">every employee in {audienceSummary}</span>.
              Make sure your message is ready before posting.
            </p>
          </div>
        )}

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

        {/* Link URL */}
        <div>
          <label htmlFor="ann-link" className={labelClass}>
            Link (optional)
          </label>
          <input
            id="ann-link"
            type="url"
            className={inputClass}
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://…"
            disabled={isPending}
          />
          <p className="mt-1 text-xs text-dc-text-3">
            YouTube, Loom, and Vimeo URLs embed automatically in the worker app. Other links open in the browser.
          </p>
          {requiresAccountWarning(linkUrl) && (
            <div className="mt-2 flex items-start gap-1.5 rounded-md border border-amber-400/30 bg-amber-400/8 px-2.5 py-2">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-500" strokeWidth={2} aria-hidden />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Workers will need a Google or Microsoft account to open this link. Consider uploading to YouTube, Loom, or Vimeo for video content — those embed directly and require no account.
              </p>
            </div>
          )}
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

        <Button
          type="submit"
          color="dark"
          disabled={isPending || !title.trim() || !body.trim() || selected.length === 0}
          className="w-full justify-center"
        >
          {isPending
            ? "Posting…"
            : isOrgWide
            ? "Post to All Teams"
            : selectedDepts.length === 1
            ? `Post to ${selectedDepts[0].name}`
            : `Post to ${selectedDepts.length} Teams`}
        </Button>
      </form>
    </div>
  );
}

