"use client";

import {
  ArrowUp,
  BatteryFull,
  ExternalLink,
  RefreshCw,
  Signal,
  Smartphone,
  Tablet,
  Wifi,
} from "lucide-react";
import { useRef, useState } from "react";

import type { WorkerLanguage } from "@/lib/types/sop";

type Device = "phone" | "tablet";

interface DeviceSpec {
  label: string;
  width: number;
  height: number;
  icon: typeof Smartphone;
}

const DEVICES: Record<Device, DeviceSpec> = {
  phone: { label: "Phone", width: 390, height: 844, icon: Smartphone },
  tablet: { label: "Tablet", width: 768, height: 1024, icon: Tablet },
};

const DEFAULT_PATH = "/app/home";

interface Props {
  initialLang: WorkerLanguage;
}

export function EmulatorClient({ initialLang }: Props) {
  const [device, setDevice] = useState<Device>("phone");
  const [lang, setLang] = useState<WorkerLanguage>(initialLang);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Tracks the iframe's current pathname so the address bar reflects
  // navigation inside the worker app. Read on every iframe `load`
  // event; same-origin iframe so contentWindow access is allowed.
  const [currentPath, setCurrentPath] = useState<string>(DEFAULT_PATH);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Keyed by language so that toggling EN/ES forces the iframe to
  // remount with the new ?lang= rather than relying on contentWindow
  // navigation (which would race with the read of pathname below).
  const initialSrc = `${DEFAULT_PATH}?lang=${lang}`;

  function postScrollTop(enabled: boolean) {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "OPSF_SCROLL_TOP", enabled },
      window.location.origin,
    );
  }

  function handleIframeLoad() {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      const path = win.location.pathname;
      setCurrentPath(path);
    } catch {
      // Cross-origin would throw; same-origin iframe shouldn't, but
      // swallow defensively so the emulator never crashes the dashboard.
    }
    // Re-send scroll-top preference after every navigation — the new
    // page's listener needs to receive the current state on mount.
    if (showScrollTop) postScrollTop(true);
  }

  function toggleScrollTop() {
    const next = !showScrollTop;
    setShowScrollTop(next);
    postScrollTop(next);
  }

  function reload() {
    iframeRef.current?.contentWindow?.location.reload();
  }

  function openInNewTab() {
    const win = iframeRef.current?.contentWindow;
    const href = win?.location.href ?? `${DEFAULT_PATH}?lang=${lang}`;
    window.open(href, "_blank", "noopener,noreferrer");
  }

  function pickLang(next: WorkerLanguage) {
    if (next === lang) return;
    setLang(next);
    // Re-point the iframe at its current path with the new lang param.
    // Setting iframe.src triggers a navigation, which fires `load` and
    // updates currentPath via handleIframeLoad. Using the *current*
    // pathname (not DEFAULT_PATH) preserves whatever page the user
    // navigated to inside the emulator.
    const path = currentPath || DEFAULT_PATH;
    if (iframeRef.current) {
      iframeRef.current.src = `${path}?lang=${next}`;
    }
  }

  // If the parent updates `device`, the iframe size animates via CSS;
  // no remount needed. Width/height are driven by inline styles below.

  const spec = DEVICES[device];

  return (
    <div className="flex flex-col gap-4">
      {/* Control bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dc-edge bg-dc-surface px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <DeviceToggle current={device} onSelect={setDevice} />
          <LangToggle current={lang} onSelect={pickLang} />
          <ScrollTopToggle enabled={showScrollTop} onToggle={toggleScrollTop} />
        </div>

        <div className="flex items-center gap-2">
          <span
            aria-label="Worker app URL"
            className="hidden truncate rounded-md border border-dc-edge bg-dc-bg px-2 py-1 font-mono text-xs text-dc-text-2 sm:block sm:max-w-[280px]"
          >
            {currentPath}
          </span>
          <IconButton onClick={reload} label="Reload">
            <RefreshCw className="size-4" strokeWidth={2} aria-hidden />
          </IconButton>
          <IconButton onClick={openInNewTab} label="Open in new tab">
            <ExternalLink className="size-4" strokeWidth={2} aria-hidden />
          </IconButton>
        </div>
      </div>

      {/* Phone frame */}
      <div className="flex justify-center">
        <DeviceFrame width={spec.width} height={spec.height}>
          <iframe
            ref={iframeRef}
            src={initialSrc}
            title="Worker app preview"
            onLoad={handleIframeLoad}
            className="size-full border-0"
            // sandbox is intentionally *not* set: the iframe runs in
            // the same origin as the dashboard and needs full Clerk
            // session cookies + Server Action support. Tight CSP at
            // the app level handles the trust model.
          />
        </DeviceFrame>
      </div>
    </div>
  );
}

// ── Device frame ─────────────────────────────────────────────────────────────

// Status bar height matches iOS standard (44pt). Real worker apps
// have to leave room here; rendering it in the emulator forces the
// preview to honor the same safe area.
const STATUS_BAR_HEIGHT = 44;

function DeviceFrame({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{ width, height }}
      className="relative shrink-0 overflow-hidden rounded-[44px] border-[10px] border-zinc-900 bg-zinc-900 shadow-2xl transition-[width,height] duration-300 ease-out dark:border-zinc-700"
    >
      <div className="flex size-full flex-col overflow-hidden rounded-[34px] bg-white">
        <StatusBar />
        <div className="min-h-0 flex-1 overflow-hidden bg-dc-bg">
          {children}
        </div>
      </div>
      {/* Dynamic-island-style notch sits on top of the status bar. */}
      <div className="pointer-events-none absolute top-1.5 left-1/2 z-10 h-7 w-28 -translate-x-1/2 rounded-full bg-zinc-900" />
    </div>
  );
}

function StatusBar() {
  return (
    <div
      style={{ height: STATUS_BAR_HEIGHT }}
      className="flex shrink-0 items-end justify-between bg-white px-7 pb-1.5 text-[13px] font-semibold text-zinc-900 select-none"
      aria-hidden
    >
      <span className="tabular-nums">9:41</span>
      <span className="flex items-center gap-1.5">
        <Signal className="size-3.5" strokeWidth={2.5} />
        <Wifi className="size-3.5" strokeWidth={2.5} />
        <BatteryFull className="size-4" strokeWidth={2.5} />
      </span>
    </div>
  );
}

// ── Device toggle ────────────────────────────────────────────────────────────

function DeviceToggle({
  current,
  onSelect,
}: {
  current: Device;
  onSelect: (d: Device) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Device size"
      className="inline-flex rounded-lg border border-dc-edge bg-dc-bg p-0.5"
    >
      {(Object.keys(DEVICES) as Device[]).map((key) => {
        const Icon = DEVICES[key].icon;
        const active = current === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            aria-pressed={active}
            title={DEVICES[key].label}
            className={[
              "flex min-h-[36px] items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
              active
                ? "bg-(--color-brand) text-white"
                : "text-dc-text-2 hover:text-dc-text",
            ].join(" ")}
          >
            <Icon className="size-3.5" strokeWidth={2} aria-hidden />
            {DEVICES[key].label}
          </button>
        );
      })}
    </div>
  );
}

// ── Language toggle ──────────────────────────────────────────────────────────

function LangToggle({
  current,
  onSelect,
}: {
  current: WorkerLanguage;
  onSelect: (l: WorkerLanguage) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex rounded-lg border border-dc-edge bg-dc-bg p-0.5"
    >
      {(["en", "es"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onSelect(l)}
          aria-pressed={current === l}
          className={[
            "min-h-[36px] min-w-[44px] rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
            current === l
              ? "bg-(--color-brand) text-white"
              : "text-dc-text-2 hover:text-dc-text",
          ].join(" ")}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// ── Scroll-to-top toggle ─────────────────────────────────────────────────────

function ScrollTopToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      title={enabled ? "Hide scroll-to-top button" : "Show scroll-to-top button"}
      className={[
        "flex min-h-[36px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
        enabled
          ? "border-(--color-brand)/30 bg-(--color-brand)/10 text-(--color-brand)"
          : "border-dc-edge bg-dc-bg text-dc-text-2 hover:text-dc-text",
      ].join(" ")}
    >
      <ArrowUp className="size-3.5" strokeWidth={2} aria-hidden />
      Scroll top
    </button>
  );
}

// ── Icon button ──────────────────────────────────────────────────────────────

function IconButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-dc-edge bg-dc-bg text-dc-text transition-colors hover:bg-dc-raised"
    >
      {children}
    </button>
  );
}

