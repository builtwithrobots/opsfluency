"use client";

import { useCallback, useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { Bell, Building2, ExternalLink, Globe, Pin } from "lucide-react";

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

function unreadCountLabel(n: number, lang: WorkerLanguage): string {
  return lang === "es" ? `${n} sin leer` : `${n} unread`;
}

// Returns an embeddable iframe src for YouTube, Loom, and Vimeo URLs.
// Returns null for all other URLs (they render as a link button instead).
function getEmbedSrc(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "www.youtube.com" || u.hostname === "youtube.com") {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube-nocookie.com/embed/${v}`;
    }
    if (u.hostname === "youtu.be") {
      const v = u.pathname.slice(1);
      if (v) return `https://www.youtube-nocookie.com/embed/${v}`;
    }
    if (u.hostname === "www.loom.com" || u.hostname === "loom.com") {
      const m = u.pathname.match(/\/share\/([a-f0-9]+)/i);
      if (m) return `https://www.loom.com/embed/${m[1]}`;
    }
    if (u.hostname === "vimeo.com" || u.hostname === "www.vimeo.com") {
      const m = u.pathname.match(/\/(\d+)/);
      if (m) return `https://player.vimeo.com/video/${m[1]}`;
    }
    return null;
  } catch {
    return null;
  }
}

function getLinkLabel(lang: WorkerLanguage): string {
  return lang === "es" ? "Ver recurso adjunto" : "View attached resource";
}

// ── Per-card component ────────────────────────────────────────────────────────

interface CardProps {
  ann: AnnouncementWithRead;
  index: number;
  lang: WorkerLanguage;
  strings: Props["strings"];
  onRead: (id: string) => void;
}

function AnnouncementCard({ ann, index, lang, strings, onRead }: CardProps) {
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef<HTMLLIElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const title = lang === "es" ? ann.title_es : ann.title_en;
  const body = lang === "es" ? ann.body_es : ann.body_en;
  const isUrgent = ann.priority === "urgent";
  const isUnread = !ann.is_read;
  const embedSrc = ann.link_url ? getEmbedSrc(ann.link_url) : null;
  const bodyTruncatable = body.length > 160;

  // Auto-mark as read once the card has been visible (≥70%) for 1.5 s.
  // Avoids requiring a deliberate tap — workers scan down the list and
  // visibility alone signals they've seen the item.
  useEffect(() => {
    if (!isUnread) return;
    const el = cardRef.current;
    if (!el) return;

    // Stagger each card's mark-read timer by its position in the list so a
    // viewport full of unread cards doesn't fire its state flips in lockstep
    // and produce a visible cascade of layout updates.
    const dwellMs = 1500 + index * 200;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timerRef.current = setTimeout(() => onRead(ann.id), dwellMs);
        } else {
          if (timerRef.current) clearTimeout(timerRef.current);
        }
      },
      { threshold: 0.7 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [ann.id, index, isUnread, onRead]);

  return (
    <li
      ref={cardRef}
      lang={lang}
      className={[
        "overflow-hidden rounded-2xl border bg-dc-surface",
        "transition-[border-color,box-shadow] duration-300",
        isUrgent
          ? "border-red-500 shadow-[inset_4px_0_0_theme(colors.red.500)]"
          : isUnread
            ? "border-(--color-brand) shadow-[inset_4px_0_0_var(--color-brand)]"
            : "border-dc-edge",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="p-4">
        {/* Badge row — urgent / pinned chips sit above the title */}
        {(isUrgent || ann.pinned) && (
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {isUrgent && (
              <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-500">
                {strings.urgent}
              </span>
            )}
            {ann.pinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-dc-raised px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-dc-text-2">
                <Pin className="size-3" aria-hidden />
                {strings.pinned}
              </span>
            )}
          </div>
        )}

        {/* Title row — unread dot leads the title.
            The dot slot is always rendered so the title's horizontal position
            doesn't shift when a card flips from unread to read; only the dot's
            colour and the title's colour transition. */}
        <div className="flex items-start gap-2">
          <span
            aria-hidden
            className={`mt-[5px] size-2 shrink-0 rounded-full transition-colors duration-300 ${
              isUnread ? "bg-(--color-brand)" : "bg-transparent"
            }`}
          />
          <p
            className={`text-base leading-snug font-semibold transition-colors duration-300 ${
              isUnread ? "text-dc-text" : "text-dc-text-2"
            }`}
          >
            {title}
          </p>
        </div>

        {/* Body with 3-line clamp and expand affordance */}
        <p
          className={`mt-1.5 text-sm leading-relaxed text-dc-text-2 whitespace-pre-line ${
            expanded ? "" : "line-clamp-3"
          }`}
        >
          {body}
        </p>
        {bodyTruncatable && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-0.5 flex min-h-[44px] items-center text-xs font-medium text-(--color-brand) active:opacity-60"
          >
            {lang === "es" ? "Leer más" : "Read more"}
          </button>
        )}

        {/* Metadata footer — department + timestamp */}
        <div className="mt-3 flex items-center gap-2 text-xs text-dc-text-3">
          {ann.department_id === null ? (
            <span className="flex items-center gap-1">
              <Globe className="size-3.5" aria-hidden />
              {strings.allTeams}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Building2 className="size-3.5" aria-hidden />
              {ann.department_name}
            </span>
          )}
          <span className="ml-auto">{timeAgo(ann.created_at, lang)}</span>
        </div>
      </div>

      {/* Link / embed — outside the main content area to keep layout clean */}
      {ann.link_url && (
        <div className="border-t border-dc-edge px-4 pb-4 pt-3">
          {embedSrc ? (
            <div
              className="relative w-full overflow-hidden rounded-xl"
              style={{ paddingBottom: "56.25%" }}
            >
              <iframe
                src={embedSrc}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={title}
                loading="lazy"
              />
            </div>
          ) : (
            <a
              href={ann.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-(--color-brand)/30 bg-(--color-brand)/10 px-4 py-2.5 text-sm font-medium text-(--color-brand) transition-colors hover:bg-(--color-brand)/20 active:scale-[0.98] active:bg-(--color-brand)/30"
            >
              <ExternalLink className="size-4 shrink-0" aria-hidden />
              {getLinkLabel(lang)}
            </a>
          )}
        </div>
      )}
    </li>
  );
}

// ── Feed ──────────────────────────────────────────────────────────────────────

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

  const handleMarkRead = useCallback(
    (announcementId: string) => {
      startTransition(async () => {
        markRead(announcementId);
        await markAnnouncementRead({ announcement_id: announcementId });
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [markRead],
  );

  function handleMarkAllRead() {
    startTransition(async () => {
      markRead("all");
      await markAllAnnouncementsRead();
    });
  }

  return (
    <section aria-labelledby="announcements-heading">
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2
            id="announcements-heading"
            className="text-base font-bold tracking-tight text-dc-text"
          >
            {strings.heading}
          </h2>
          {unreadCount > 0 && (
            <span
              className="flex size-5 items-center justify-center rounded-full bg-(--color-brand) text-[10px] font-bold text-white"
              aria-label={unreadCountLabel(unreadCount, lang)}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>

        {/* Negative margin extends the tap area to the card edge */}
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="-mr-3 flex min-h-[44px] items-center px-3 text-xs font-medium text-(--color-brand) active:opacity-60"
          >
            {strings.markAllRead}
          </button>
        )}
      </div>

      {optimisticAnn.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-dc-edge bg-dc-surface px-6 py-10 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-(--color-brand)/10">
            <Bell className="size-6 text-(--color-brand)" strokeWidth={1.5} aria-hidden />
          </div>
          <p className="text-sm font-semibold text-dc-text">{strings.empty}</p>
          <p className="mt-1 text-xs text-dc-text-3">
            {lang === "es" ? "Todo está tranquilo por ahora." : "All quiet for now."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4" role="list">
          {optimisticAnn.map((ann, index) => (
            <AnnouncementCard
              key={ann.id}
              ann={ann}
              index={index}
              lang={lang}
              strings={strings}
              onRead={handleMarkRead}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
