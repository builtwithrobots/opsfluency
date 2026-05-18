"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import type { WorkerLanguage } from "@/lib/types/sop";

export interface GalleryImage {
  id: string;
  url: string;
  caption: string | null;
}

interface Props {
  images: GalleryImage[];
  lang: WorkerLanguage;
}

const STRINGS = {
  en: { close: "Close", previous: "Previous image", next: "Next image", counter: (i: number, n: number) => `${i} of ${n}` },
  es: { close: "Cerrar", previous: "Imagen anterior", next: "Imagen siguiente", counter: (i: number, n: number) => `${i} de ${n}` },
} as const;

/**
 * Inline thumbnail strip + tap-to-open fullscreen lightbox for SOP media.
 * Workers tap a diagram, get it fullscreen, swipe between images, and
 * dismiss by tapping the X or swiping down. Caption stays anchored at
 * the bottom of the viewport so it's not cropped on tall photos.
 */
export function MediaGallery({ images, lang }: Props) {
  const t = STRINGS[lang];
  // null = closed; otherwise the index of the currently-open image
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  // Keyboard support — ESC closes, arrows navigate
  useEffect(() => {
    if (activeIdx === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActiveIdx(null);
      if (e.key === "ArrowRight") setActiveIdx((i) => (i === null ? null : (i + 1) % images.length));
      if (e.key === "ArrowLeft") setActiveIdx((i) => (i === null ? null : (i - 1 + images.length) % images.length));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIdx, images.length]);

  // Lock body scroll while the lightbox is open
  useEffect(() => {
    if (activeIdx === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [activeIdx]);

  function goPrev() {
    setActiveIdx((i) => (i === null ? null : (i - 1 + images.length) % images.length));
  }
  function goNext() {
    setActiveIdx((i) => (i === null ? null : (i + 1) % images.length));
  }

  const active = activeIdx !== null ? images[activeIdx] : null;

  return (
    <>
      <div className="flex flex-col gap-6">
        {images.map((img, i) => (
          <figure key={img.id} className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setActiveIdx(i)}
              className="group/img relative block w-full overflow-hidden rounded-lg border border-dc-edge bg-dc-raised transition-transform duration-200 hover:scale-[1.005] active:scale-[0.995]"
              aria-label={img.caption ?? `Image ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.caption ?? ""}
                className="w-full object-contain"
                loading="lazy"
              />
              {/* Subtle hint that the image is interactive */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover/img:bg-black/5"
              />
            </button>
            {img.caption && (
              <figcaption className="text-sm text-dc-text-2">{img.caption}</figcaption>
            )}
          </figure>
        ))}
      </div>

      <AnimatePresence>
        {active && activeIdx !== null && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={active.caption ?? `Image ${activeIdx + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex flex-col bg-black/92 backdrop-blur"
            onClick={(e) => {
              // Click outside the image closes the lightbox
              if (e.target === e.currentTarget) setActiveIdx(null);
            }}
          >
            {/* Top bar: counter + close */}
            <div className="flex items-center justify-between px-4 py-3 text-white/80">
              <span className="text-sm font-medium tabular-nums">
                {t.counter(activeIdx + 1, images.length)}
              </span>
              <button
                type="button"
                onClick={() => setActiveIdx(null)}
                aria-label={t.close}
                className="flex size-11 items-center justify-center rounded-full text-white hover:bg-white/10"
              >
                <X className="size-6" strokeWidth={2.25} />
              </button>
            </div>

            {/* Swipeable image area */}
            <motion.div
              key={active.id}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) goNext();
                else if (info.offset.x > 60) goPrev();
              }}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.18 }}
              className="flex flex-1 items-center justify-center px-4 touch-pan-y"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active.url}
                alt={active.caption ?? ""}
                className="max-h-full max-w-full select-none object-contain"
                draggable={false}
              />
            </motion.div>

            {/* Bottom: caption + prev/next */}
            <div className="px-4 pb-6 pt-3 text-center text-sm text-white/90">
              {active.caption && (
                <p className="mx-auto max-w-2xl">{active.caption}</p>
              )}
              {images.length > 1 && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label={t.previous}
                    className="flex size-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/15"
                  >
                    <ChevronLeft className="size-6" strokeWidth={2.25} />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label={t.next}
                    className="flex size-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/15"
                  >
                    <ChevronRight className="size-6" strokeWidth={2.25} />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
