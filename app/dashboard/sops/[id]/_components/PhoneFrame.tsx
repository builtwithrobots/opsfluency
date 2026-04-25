/**
 * Reusable phone-frame around an iframe of `/app/sop/[id]?preview=1`.
 *
 * Why a fixed 390×844 viewport: that's the logical size of an iPhone 12+
 * (the device most warehouse workers carry), so what the manager sees here
 * is pixel-accurate to what the worker sees on a real phone — no
 * Tailwind responsive guessing needed.
 *
 * The chassis is a dark rounded rectangle with a bezel and a subtle dynamic-
 * island silhouette. Decorative only — the iframe renders the real worker
 * page, including the EN/ES toggle, callouts, and Markdown.
 */

interface PhoneFrameProps {
  /** Source URL for the iframe content (worker reader page is the typical caller). */
  src: string;
  /** Accessible title for the iframe. Required by a11y guidelines. */
  title: string;
  /** Optional caption rendered below the device. */
  caption?: string;
}

export function PhoneFrame({ src, title, caption }: PhoneFrameProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Chassis */}
      <div
        className="relative shrink-0 rounded-[2.75rem] bg-zinc-900 p-3 shadow-2xl ring-1 ring-zinc-800"
        // Width = screen width (390) + 2 × p-3 (12) on each side = 414
        style={{ width: 414 }}
        aria-hidden={false}
      >
        {/* Dynamic island — purely decorative */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-5 left-1/2 z-10 h-6 w-28 -translate-x-1/2 rounded-full bg-black"
        />

        {/* Screen */}
        <div className="overflow-hidden rounded-[2.25rem] bg-white">
          <iframe
            title={title}
            src={src}
            width={390}
            height={844}
            // allow-same-origin + allow-scripts so Clerk session passes through
            // and the worker page can run client-side JS (LanguageToggleClient).
            // allow-forms lets the toggle's Server Action POST work.
            sandbox="allow-scripts allow-same-origin allow-forms"
            className="block h-[844px] w-[390px] border-0 bg-white"
          />
        </div>
      </div>

      {caption && (
        <p className="text-xs text-dc-text-3">{caption}</p>
      )}
    </div>
  );
}
