'use client';

import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { TEMPLATE_TAGLINES, type PrintConfig } from '@/lib/qr/print-config';

interface Props {
  qrCodeId: string;
  config: PrintConfig;
  companyName?: string;
  logoUrl?: string | null;
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
const SHEET_W = 768;
const SHEET_H = 1008;

/**
 * Live print preview at 768×1008pt (8.5×11in at 96dpi minus 0.25in margins).
 * Measures the wrapper width on mount and on resize, then scales the fixed
 * sheet down proportionally so it never overflows its container.
 */
export default function QRPrintPreview({
  qrCodeId,
  config,
  companyName,
  logoUrl,
}: Props) {
  const wrapperRef          = useRef<HTMLDivElement>(null);
  const [scale, setScale]   = useState(1);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const update = () => {
      const w = el.getBoundingClientRect().width;
      setScale(Math.min(1, w / SHEET_W));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scanUrl = `${appUrl}/s/${qrCodeId}`;
  const qrPx    = Math.round((config.qr_size / 100) * SHEET_W * 0.7);
  const tagline = TEMPLATE_TAGLINES[config.template];

  return (
    /* Outer: reserves the correct height based on the computed scale */
    <div
      ref={wrapperRef}
      className="w-full overflow-hidden"
      style={{ height: SHEET_H * scale }}
    >
      <div
        className="origin-top-left"
        style={{
          width:     SHEET_W,
          height:    SHEET_H,
          transform: `scale(${scale})`,
        }}
      >
        {/* Print sheet — id used by @media print CSS to isolate this element */}
        <div
          id="qr-print-sheet"
          className="flex h-full flex-col items-center justify-between bg-white px-10 py-8 font-sans"
        >
          {/* Top: logo + company name */}
          <div className="flex flex-col items-center gap-2">
            {config.show_logo && logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={companyName ?? 'Company logo'}
                className="max-h-16 max-w-[220px] object-contain"
              />
            )}
            {config.show_logo && !logoUrl && companyName && (
              <p className="text-lg font-bold text-neutral-800">{companyName}</p>
            )}
          </div>

          {/* Middle: header / QR / sub-header */}
          <div className="flex flex-col items-center gap-4 text-center">
            {config.header && (
              <h2 className="text-2xl font-bold text-neutral-900">{config.header}</h2>
            )}
            {config.sub_header && (
              <p className="text-base text-neutral-600">{config.sub_header}</p>
            )}

            <QRCodeSVG
              value={scanUrl}
              size={qrPx}
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
              includeMargin
            />

            <p className="text-sm text-neutral-500">{tagline}</p>
          </div>

          {/* Footer */}
          <div className="flex flex-col items-center gap-1 text-center">
            {config.footer && (
              <p className="text-sm text-neutral-700">{config.footer}</p>
            )}
            {config.footer2 && (
              <p className="text-xs text-neutral-500">{config.footer2}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
