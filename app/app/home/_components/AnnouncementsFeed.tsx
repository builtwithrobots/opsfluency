"use client";

import { useOptimistic, useTransition } from "react";
import { Bell, Building2, Globe, Pin } from "lucide-react";

import {
  markAllAnnouncementsRead,
  markAnnouncementRead,
} from "@/app/dashboard/announcements/_actions";
import type { AnnouncementWithRead } from "@/lib/types/announcements";
import type { WorkerLanguage } from "@/lib/types/sop";

interface Props {
  announcements: AnnouncementWithRead[];
  lang: WorkerLanguage;
  strings: {
    heading: string;
    empty: string;
    markAllRead: string;
    unreadCount: (n: number) => string;
    allTeams: string;
    urgent: string;
    pinned: string;
    justNow: string;
  };
}

function timeAgo(iso: string, lang: WorkerLanguage): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return lang === "es" ? "ahora mismo" : "just now";
  if (mins < 60) return lang === "es" ? `hace ${mins}m` : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return lang === "es" ? `hace ${hrs}h` : `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return lang === "es" ? `hace ${days}d` : `${days}d ago`;
  return new Date(iso).toLocaleDateString(lang === "es" ? "es" : "en");
}

export function AnnouncementsFeed({ announcements, lang, strings }: Props) {
  const [, startTransition] = useTransition();

  const [optimisticAnn, markRead] = useOptimistic(
    announcements,
    (state, announcementId: string | "all") => {
      if (announcementId === "all") {
        return state.map((a) => ({ ...a, is_read: true }));
      }
      return state.map((a) =>
        a.id === announcementId ? { ...a, is_read: true } : a,
      );
    },
  );

  const unreadCount = optimisticAnn.filter((a) => !a.is_read).length;

  function handleMarkRead(announcementId: string) {
    startTransition(async () => {
      markRead(announcementId);
      await markAnnouncementRead({ announcement_id: announcementId });
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      markRead("all");
      await markAllAnnouncementsRead();
    });
  }

  return (
    <section aria-labelledby="announcements-heading">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2
            id="announcements-heading"
            className="text-sm font-semibold tracking-wide text-dc-text-2 uppercase"
          >
            {strings.heading}
          </h2>
          {unreadCount > 0 && (
            <span
              className="flex size-5 items-center justify-center rounded-full bg-(--color-brand) text-[10px] font-bold text-white"
              aria-label={strings.unreadCount(unreadCount)}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-xs font-medium text-(--color-brand) hover:underline"
          >
            {strings.markAllRead}
          </button>
        )}
      </div>

      {optimisticAnn.length === 0 ? (
        <div className="rounded-xl border border-dc-edge bg-dc-surface p-5 text-center">
          <Bell className="mx-auto size-6 text-dc-text-3" strokeWidth={2} aria-hidden />
          <p className="mt-2 text-sm text-dc-text-2">{strings.empty}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2" role="list">
          {optimisticAnn.map((ann) => {
            const title = lang === "es" ? ann.title_es : ann.title_en;
            const body = lang === "es" ? ann.body_es : ann.body_en;
            const isUrgent = ann.priority === "urgent";
            const isUnread = !ann.is_read;

            return (
              <li key={ann.id} lang={lang}>
                <button
                  type="button"
                  onClick={() => !ann.is_read && handleMarkRead(ann.id)}
                  className={[
                    "w-full rounded-xl border bg-dc-surface p-4 text-left transition-colors",
                    // Border: urgent = red, unread normal = brand, read = default edge
                    isUrgent
                      ? "border-red-500"
                      : isUnread
                        ? "border-(--color-brand)"
                        : "border-dc-edge",
                    // Left accent bar via box-shadow
                    isUrgent
                      ? "shadow-[inset_4px_0_0_theme(colors.red.500)]"
                      : isUnread
                        ? "shadow-[inset_4px_0_0_var(--color-brand)]"
                        : "",
                    // Hover only if unread
                    isUnread ? "hover:bg-dc-raised/50 active:bg-dc-raised" : "",
                    // Min height for glove-friendly taps
                    "min-h-[80px]",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-pressed={ann.is_read}
                  aria-label={`${title}${isUnread ? " — tap to mark as read" : ""}`}
                >
                  {/* Header row */}
                  <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    {ann.pinned && (
                      <Pin
                        className="size-3 text-(--color-brand)"
                        aria-label={strings.pinned}
                      />
                    )}
                    {isUrgent && (
                      <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-500">
                        {strings.urgent}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-dc-text-3">
                      {ann.department_id === null ? (
                        <>
                          <Globe className="size-3" aria-hidden />
                          {strings.allTeams}
                        </>
                      ) : (
                        <>
                          <Building2 className="size-3" aria-hidden />
                          {ann.department_name}
                        </>
                      )}
                    </span>
                    <span className="ml-auto text-xs text-dc-text-3">
                      {timeAgo(ann.created_at, lang)}
                    </span>
                  </div>

                  {/* Title */}
                  <p
                    className={`text-base leading-snug ${
                      isUnread ? "font-semibold text-dc-text" : "font-medium text-dc-text-2"
                    }`}
                  >
                    {title}
                  </p>

                  {/* Body */}
                  <p className="mt-1 text-sm text-dc-text-2 whitespace-pre-line">{body}</p>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
