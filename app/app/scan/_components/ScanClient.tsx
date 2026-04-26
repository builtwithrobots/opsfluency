"use client";

import { Scanner, type IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { AlertCircle, Camera, CheckCircle2, ScanLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
        {/* Custom finder reticle. The library's built-in is disabled
            above to keep the visual style consistent with the rest of
            the worker app. */}
        {!paused && !result ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="size-3/5 rounded-2xl border-4 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
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
      ) : null}

      {result?.kind === "foreign" ? (
        <ResultCard
          tone="warn"
          icon={AlertCircle}
          title={t.foreignUrl}
          subtitle={`${t.raw} ${result.raw}`}
          secondary={{ label: t.scanAgain, onClick: reset }}
        />
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
