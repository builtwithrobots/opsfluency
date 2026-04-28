"use client";

import { useState, useTransition } from "react";
import { Bell, Building2, Globe, Pin, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { deleteAnnouncement } from "@/app/dashboard/announcements/_actions";
import type { AnnouncementWithMeta } from "@/lib/types/announcements";

interface Props {
  announcements: AnnouncementWithMeta[];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function AnnouncementTableClient({ announcements: serverAnnouncements }: Props) {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState(serverAnnouncements);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleDelete(id: string) {
    // Optimistic removal
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    setDeletingId(id);

    startTransition(async () => {
      const result = await deleteAnnouncement({ id });
      if (!result.ok) {
        // Revert on failure
        setAnnouncements(serverAnnouncements);
        setDeletingId(null);
        router.refresh();
      } else {
        setDeletingId(null);
      }
    });
  }

  if (!announcements.length) {
    return (
      <div className="rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-6 py-12 text-center">
        <Bell className="mx-auto size-8 text-dc-text-3" strokeWidth={1.5} aria-hidden />
        <p className="mt-3 text-sm font-medium text-dc-text-2">No announcements yet</p>
        <p className="mt-1 text-xs text-dc-text-3">
          Post one above to let your team know what&apos;s happening.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[color:var(--dc-edge)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[color:var(--dc-edge)] bg-dc-raised">
            <th className="px-4 py-3 text-left text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase">
              Announcement
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase sm:table-cell">
              Audience
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase md:table-cell">
              Posted
            </th>
            <th className="w-12 px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[color:var(--dc-edge)] bg-dc-surface">
          {announcements.map((ann) => (
            <tr key={ann.id} className="group hover:bg-dc-raised/50">
              <td className="px-4 py-3">
                <div className="flex items-start gap-2">
                  {ann.pinned && (
                    <Pin
                      className="mt-0.5 size-3.5 shrink-0 text-(--color-brand)"
                      aria-label="Pinned"
                    />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-dc-text">{ann.title_en}</p>
                      {ann.priority === "urgent" && (
                        <span className="shrink-0 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-500">
                          URGENT
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-dc-text-3">{ann.body_en}</p>
                    {/* Mobile: show audience inline */}
                    <div className="mt-1 flex items-center gap-1 sm:hidden">
                      {ann.department_id === null ? (
                        <Globe className="size-3 text-dc-text-3" />
                      ) : (
                        <Building2 className="size-3 text-dc-text-3" />
                      )}
                      <span className="text-xs text-dc-text-3">
                        {ann.department_id === null
                          ? "All Teams"
                          : (ann.department_name ?? "Department")}
                      </span>
                    </div>
                  </div>
                </div>
              </td>

              <td className="hidden px-4 py-3 sm:table-cell">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--dc-edge)] px-2.5 py-1 text-xs text-dc-text-2">
                  {ann.department_id === null ? (
                    <Globe className="size-3 text-(--color-brand)" />
                  ) : (
                    <Building2 className="size-3 text-dc-text-3" />
                  )}
                  {ann.department_id === null
                    ? "All Teams"
                    : (ann.department_name ?? "Department")}
                </span>
              </td>

              <td className="hidden px-4 py-3 text-xs text-dc-text-3 md:table-cell">
                {timeAgo(ann.created_at)}
                {ann.expires_at && (
                  <p className="mt-0.5 text-dc-text-3/70">
                    Expires {new Date(ann.expires_at).toLocaleDateString()}
                  </p>
                )}
              </td>

              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => handleDelete(ann.id)}
                  disabled={deletingId === ann.id}
                  className="rounded-md p-1.5 text-dc-text-3 opacity-0 transition-opacity hover:bg-dc-raised hover:text-red-500 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`Delete "${ann.title_en}"`}
                >
                  <Trash2 className="size-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
