'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download, FileCode, FileImage } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

/** Turns a QR label into a safe filename stem: "Forklift Safety" → "forklift-safety". */
function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    || 'qr-code';
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
  if (href.startsWith('blob:')) {
    setTimeout(() => URL.revokeObjectURL(href), 100);
  }
}

interface Props {
  qrCodeId: string;
  /** QR label — used to name the downloaded file. */
  label: string;
  /**
   * 'icon'   → compact icon-only trigger (for list cards)
   * 'button' → labelled trigger with chevron (for print editor)
   */
  variant?: 'icon' | 'button';
}

export default function QRDownloadButton({
  qrCodeId,
  label,
  variant = 'button',
}: Props) {
  const scanUrl      = `${appUrl}/s/${qrCodeId}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef      = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const slug = slugify(label);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onMouse = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouse);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function getSvgElement(): SVGSVGElement | null {
    return containerRef.current?.querySelector('svg') ?? null;
  }

  function downloadSvg() {
    const el = getSvgElement();
    if (!el) return;
    // Ensure the SVG has the correct XML namespace for standalone use.
    el.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const svgStr  = new XMLSerializer().serializeToString(el);
    const blob    = new Blob([svgStr], { type: 'image/svg+xml' });
    triggerDownload(URL.createObjectURL(blob), `${slug}-qr.svg`);
    setOpen(false);
  }

  function downloadPng() {
    const el = getSvgElement();
    if (!el) return;
    const SIZE = 1024;
    el.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const svgStr  = new XMLSerializer().serializeToString(el);
    const blob    = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl  = URL.createObjectURL(blob);
    const img     = new Image();
    img.onload = () => {
      const canvas  = document.createElement('canvas');
      canvas.width  = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      URL.revokeObjectURL(svgUrl);
      triggerDownload(canvas.toDataURL('image/png'), `${slug}-qr.png`);
    };
    img.src = svgUrl;
    setOpen(false);
  }

  return (
    <div ref={menuRef} className="relative">
      {/* Hidden QR rendered solely to provide an SVG node for serialization. */}
      <div
        ref={containerRef}
        aria-hidden="true"
        style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none', width: 0, height: 0, overflow: 'hidden' }}
      >
        <QRCodeSVG
          value={scanUrl}
          size={512}
          bgColor="#ffffff"
          fgColor="#000000"
          level="M"
          includeMargin
        />
      </div>

      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Download QR code"
        className={
          variant === 'icon'
            ? 'flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--dc-edge)] bg-dc-surface text-dc-text-2 transition-colors hover:bg-dc-raised'
            : 'flex self-stretch w-full items-center justify-center gap-1.5 rounded-lg border border-[color:var(--dc-edge)] bg-dc-surface px-3 text-sm text-dc-text-2 transition-colors hover:bg-dc-raised'
        }
      >
        <Download className="h-4 w-4 shrink-0" />
        {variant === 'button' && (
          <>
            <span>Download</span>
            <ChevronDown
              className={`ml-auto h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full z-20 mt-1.5 w-52 overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-md"
        >
          <button
            type="button"
            role="option"
            onClick={downloadSvg}
            className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-dc-raised"
          >
            <FileCode className="mt-0.5 h-4 w-4 shrink-0 text-dc-text-3" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-dc-text">Vector (SVG)</p>
              <p className="text-xs text-dc-text-3">Scales to any size</p>
            </div>
          </button>

          <div className="border-t border-[color:var(--dc-edge)]" />

          <button
            type="button"
            role="option"
            onClick={downloadPng}
            className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-dc-raised"
          >
            <FileImage className="mt-0.5 h-4 w-4 shrink-0 text-dc-text-3" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-dc-text">High-res PNG</p>
              <p className="text-xs text-dc-text-3">1024 × 1024 px</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
