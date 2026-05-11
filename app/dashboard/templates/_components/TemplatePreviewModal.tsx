"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

import {
  Dialog,
  DialogBody,
  DialogTitle,
  DialogActions,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { STYLE_LABELS, type SopStarterTemplate } from "@/lib/templates/index";

const STYLE_COLORS = {
  "step-by-step": "blue",
  "reference": "violet",
  "safety-checklist": "amber",
} as const satisfies Record<SopStarterTemplate["style"], string>;

interface Props {
  template: SopStarterTemplate | null;
  onClose: () => void;
}

type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; html: string }
  | { status: "error" };

export function TemplatePreviewModal({ template, onClose }: Props) {
  const [preview, setPreview] = useState<PreviewState>({ status: "idle" });

  useEffect(() => {
    if (!template) return;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreview({ status: "loading" });

    fetch(`/api/templates/${template.id}/preview`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.html) {
          setPreview({ status: "ok", html: data.html });
        } else {
          setPreview({ status: "error" });
        }
      })
      .catch(() => {
        if (!cancelled) setPreview({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [template]);

  return (
    <Dialog open={template !== null} onClose={onClose} size="4xl">
      {template && (
        <>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <DialogTitle>{template.title}</DialogTitle>
              <div className="flex flex-wrap gap-1.5">
                <Badge color={STYLE_COLORS[template.style]}>
                  {STYLE_LABELS[template.style]}
                </Badge>
                <Badge color="zinc">{template.category}</Badge>
              </div>
            </div>
            <button
              onClick={onClose}
              className="mt-0.5 shrink-0 rounded-md p-1 text-dc-text-3 hover:bg-dc-raised hover:text-dc-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-brand)"
              aria-label="Close preview"
            >
              <X className="size-5" strokeWidth={1.75} />
            </button>
          </div>

          <DialogBody>
            <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-[color:var(--dc-edge)] bg-white p-6">
              {preview.status === "loading" && (
                <div className="flex items-center justify-center py-16 text-sm text-dc-text-3">
                  Loading preview…
                </div>
              )}
              {preview.status === "error" && (
                <div className="flex items-center justify-center py-16 text-sm text-dc-text-3">
                  Preview unavailable — download to view.
                </div>
              )}
              {preview.status === "ok" && (
                <div
                  className="template-preview text-sm text-zinc-800 [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mb-1 [&_h2]:mt-5 [&_h2]:text-base [&_h2]:font-semibold [&_p]:mb-2 [&_p]:leading-relaxed [&_table]:mb-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-zinc-200 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-zinc-200 [&_th]:bg-zinc-50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-0.5 [&_em]:italic [&_em]:text-zinc-500"
                  dangerouslySetInnerHTML={{ __html: preview.html }}
                />
              )}
            </div>
          </DialogBody>

          <DialogActions>
            <button
              onClick={onClose}
              className="rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-4 py-2 text-sm font-medium text-dc-text transition-colors hover:bg-dc-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-brand)"
            >
              Close
            </button>
            <a
              href={`/templates/${template.filename}`}
              download={template.filename}
              className="inline-flex items-center gap-2 rounded-lg bg-(--color-brand) px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-brand)"
            >
              <Download className="size-4" strokeWidth={2} aria-hidden />
              Download .docx
            </a>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
