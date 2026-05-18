"use client";

import { Scanner, type IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { AlertCircle, Camera, CheckCircle2, ScanLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { hapticSuccess } from "@/lib/haptics";
import type { WorkerLanguage } from "@/lib/types/sop";

interface Props {
  lang: WorkerLanguage;
  appOrigin: string;
}

const STRINGS = {
  en: {
    starting: "Starting camera…",
    permissionDenied:
      "Camera permission denied. Enable camera access in your browser settings.",
    noCamera: "This device doesn't have a camera available.",
    aimHint: "Center the QR code in the box.",
    detected: "Detected:",
    openProcedure: "Open procedure",
    foreignUrl: "That QR code isn't from this workspace.",
    scanAgain: "Scan again",
    raw: "Code:",
  },
  es: {
    starting: "Iniciando la cámara…",
    permissionDenied:
      "Permiso de cámara denegado. Habilita el acceso a la cámara en la configuración del navegador.",
    noCamera: "Este dispositivo no tiene cámara disponible.",
    aimHint: "Centra el código QR dentro del recuadro.",
    detected: "Detectado:",
    openProcedure: "Abrir procedimiento",
    foreignUrl: "Ese código QR no es de este espacio.",
    scanAgain: "Escanear otra vez",
    raw: "Código:",
  },
} as const;

type Result =
  | { kind: "internal"; sopPath: string; raw: string }
  | { kind: "foreign"; raw: string };

export function ScanClient({ lang, appOrigin }: Props) {
  const router = useRouter();
  const t = STRINGS[lang];

  const [paused, setPaused] = useState(false);
  const [error, setError] = useState<"permission" | "noCamera" | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  function classify(raw: string): Result {
    // Accept either an absolute URL pointing at our /s/ scan landing,
    // or a bare /s/<id> path (some QR generators encode just the path).
    try {
      const url = raw.startsWith("/")
        ? new URL(raw, appOrigin || window.location.origin)
        : new URL(raw);
      const expectedOrigin = appOrigin || window.location.origin;
      const sameOrigin = url.origin === new URL(expectedOrigin).origin;
      const sopMatch = url.pathname.match(/^\/s\/([a-zA-Z0-9-]+)\/?$/);
      if (sameOrigin && sopMatch) {
        return { kind: "internal", sopPath: url.pathname, raw };
      }
      return { kind: "foreign", raw };
    } catch {
      return { kind: "foreign", raw };
    }
  }

  function handleScan(detected: IDetectedBarcode[]) {
    if (paused || result) return;
    const raw = detected[0]?.rawValue;
    if (!raw) return;
    const classified = classify(raw);
    setResult(classified);
    setPaused(true);
    // Buzz on detection. No-op on iOS Safari — phones that support it
    // give workers in gloves confirmation they wouldn't otherwise see.
    hapticSuccess();
  }

  function handleError(e: unknown) {
    // The library reports both permission denial and missing devices
    // through the same onError. Sniff the message to give a clearer
    // hint; default to permission since that's the common case.
    const msg = e instanceof Error ? e.message.toLowerCase() : String(e);
    if (msg.includes("notfound") || msg.includes("no camera")) {
      setError("noCamera");
    } else {
      setError("permission");
    }
  }

  function reset() {
    setResult(null);
    setPaused(false);
    setError(null);
  }

  if (error === "noCamera") {
    return <ErrorCard icon={Camera} message={t.noCamera} />;
  }
  if (error === "permission") {
    return <ErrorCard icon={AlertCircle} message={t.permissionDenied} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-dc-edge bg-zinc-900">
        <Scanner
          onScan={handleScan}
          onError={handleError}
          paused={paused}
          formats={["qr_code"]}
          constraints={{ facingMode: "environment" }}
          components={{ finder: false }}
          sound={false}
          styles={{
            container: { width: "100%", height: "100%" },
            video: { width: "100%", height: "100%", objectFit: "cover" },
          }}
        />
        {/* Custom finder reticle — replaces the library's default to keep
            visual style consistent with the rest of the worker app.

            Three layered states (idle / detected) share the same square
            footprint so layout never shifts:
              1. Vignette + animated scan line sweep + corner brackets
                 (visible while scanning).
              2. Ripple + check stamp on detection.
            All animations use globals.css keyframes that already respect
            prefers-reduced-motion. */}
        {!paused && !result ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="relative size-3/5 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
              {/* Scan line — sweeps top-to-bottom every 2.4s */}
              <span className="absolute inset-x-0 h-0.5 animate-scan-line bg-(--color-brand)" />
              {/* Four corner brackets — gently pulse */}
              {(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((pos) => {
                const map = {
                  "top-left":     "top-0 left-0  border-t-4 border-l-4 rounded-tl-xl",
                  "top-right":    "top-0 right-0 border-t-4 border-r-4 rounded-tr-xl",
                  "bottom-left":  "bottom-0 left-0  border-b-4 border-l-4 rounded-bl-xl",
                  "bottom-right": "bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl",
                } as const;
                return (
                  <span
                    key={pos}
                    className={`absolute size-7 border-white/85 animate-corner-lock ${map[pos]}`}
                  />
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Capture confirmation — ripple expands outward, checkmark stamps in. */}
        {result?.kind === "internal" ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <span className="absolute size-3/5 animate-scan-ripple rounded-2xl border-4 border-(--color-brand)" />
            <span className="flex size-20 items-center justify-center rounded-full bg-(--color-brand) text-white animate-capture-check shadow-(--shadow-float)">
              <CheckCircle2 className="size-10" strokeWidth={2.5} />
            </span>
          </div>
        ) : null}
      </div>

      {!result ? (
        <p className="text-center text-sm text-dc-text-2">
          <ScanLine
            className="mr-1.5 inline size-4"
            strokeWidth={2}
            aria-hidden
          />
          {t.aimHint}
        </p>
      ) : null}

      {result?.kind === "internal" ? (
        <div className="animate-fade-in">
          <ResultCard
            tone="success"
            icon={CheckCircle2}
            title={t.detected}
            subtitle={result.raw}
            action={{
              label: t.openProcedure,
              onClick: () => router.push(result.sopPath),
            }}
            secondary={{ label: t.scanAgain, onClick: reset }}
          />
        </div>
      ) : null}

      {result?.kind === "foreign" ? (
        <div className="animate-fade-in">
          <ResultCard
            tone="warn"
            icon={AlertCircle}
            title={t.foreignUrl}
            subtitle={`${t.raw} ${result.raw}`}
            secondary={{ label: t.scanAgain, onClick: reset }}
          />
        </div>
      ) : null}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function ErrorCard({
  icon: Icon,
  message,
}: {
  icon: typeof AlertCircle;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dc-edge bg-dc-surface p-6 text-center">
      <Icon className="size-8 text-dc-text-3" strokeWidth={2} aria-hidden />
      <p className="text-sm text-dc-text-2">{message}</p>
    </div>
  );
}

function ResultCard({
  tone,
  icon: Icon,
  title,
  subtitle,
  action,
  secondary,
}: {
  tone: "success" | "warn";
  icon: typeof AlertCircle;
  title: string;
  subtitle: string;
  action?: { label: string; onClick: () => void };
  secondary?: { label: string; onClick: () => void };
}) {
  const toneClasses =
    tone === "success"
      ? "border-(--color-brand)/40 bg-(--color-brand)/10"
      : "border-(--color-signal-warn)/40 bg-(--color-signal-warn)/10";
  const iconClasses =
    tone === "success" ? "text-(--color-brand)" : "text-(--color-signal-warn)";

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-4 ${toneClasses}`}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={`size-5 shrink-0 ${iconClasses}`}
          strokeWidth={2}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-dc-text">{title}</p>
          <p className="mt-0.5 truncate font-mono text-xs text-dc-text-2">
            {subtitle}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        {action ? (
          <button
            type="button"
            onClick={action.onClick}
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-(--color-brand) px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {action.label}
          </button>
        ) : null}
        {secondary ? (
          <button
            type="button"
            onClick={secondary.onClick}
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-dc-edge bg-dc-surface px-4 py-2 text-sm font-semibold text-dc-text transition-colors hover:bg-dc-raised"
          >
            {secondary.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}
