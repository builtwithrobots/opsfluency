'use client';

import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  FONT_FAMILY_CSS,
  TEMPLATE_TAGLINES,
  type PrintConfig,
} from '@/lib/qr/print-config';

interface Props {
  qrCodeId: string;
  config: PrintConfig;
  companyName?: string;
  logoUrl?: string | null;
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
const SHEET_W = 768;            // 8in inside 0.25in margins, at 96dpi
const SHEET_H = 1008;           // 10.5in inside 0.25in margins
const GUIDE_INSET_PX = 24;      // 0.25in guide border, inset from sheet edge

/** Baseline pt sizes per element. Multiplied by the corresponding font_size_* scale. */
const BASE_FONT_PX = {
  company_name: 18,
  header:       30,
  sub_header:   16,
  tagline:      14,
  footer:       14,
  footer2:      12,
} as const;

/**
 * Live print preview at 768×1008pt (8.5×11in at 96dpi minus 0.25in margins).
 * The sheet scales proportionally to its container.
 *
 * Layout: three vertical bands (top / middle / bottom). The middle band
 * (header + QR + tagline) flex-grows so the QR stays optically centered
 * even when the top or bottom bands are empty.
 *
 * A faint 0.25in inset border draws around the printable area as a print
 * safe-zone guide. Visible on screen and in print.
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
  const fontStack = FONT_FAMILY_CSS[config.font_family];

  /** Resolve a per-element pt size from the saved scale. */
  const sized = (baselinePx: number, scalePct: number) =>
    Math.round(baselinePx * (scalePct / 100));

  const showLogo        = config.show_logo && !!logoUrl;
  const showCompanyName = config.show_company_name && !!companyName;
  const showTopBand     = showLogo || showCompanyName;
  const showFooterBand  = !!config.footer || !!config.footer2;

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
          className="relative flex h-full flex-col bg-white"
          style={{ fontFamily: fontStack, padding: GUIDE_INSET_PX }}
        >
          {/* 0.25in faint safe-zone guide. Pointer-events:none so it never
              blocks clicks on the preview. Renders on screen + in print. */}
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              top: GUIDE_INSET_PX,
              left: GUIDE_INSET_PX,
              right: GUIDE_INSET_PX,
              bottom: GUIDE_INSET_PX,
              border: '1px solid rgba(15, 17, 23, 0.08)',
              borderRadius: 2,
            }}
          />

          {/* Top band — logo + company name. Collapses cleanly when empty. */}
          {showTopBand && (
            <div className="flex flex-col items-center gap-2 pt-6">
              {showLogo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl!}
                  alt={companyName ?? 'Company logo'}
                  className="max-h-16 max-w-[220px] object-contain"
                />
              )}
              {showCompanyName && (
                <p
                  className="font-bold text-neutral-800"
                  style={{ fontSize: sized(BASE_FONT_PX.company_name, config.font_size_company_name) }}
                >
                  {companyName}
                </p>
              )}
            </div>
          )}

          {/* Middle band — header / QR / tagline. flex-1 keeps the QR
              optically centered even when top/bottom bands are missing. */}
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
            {config.header && (
              <h2
                className="font-bold text-neutral-900 leading-tight"
                style={{ fontSize: sized(BASE_FONT_PX.header, config.font_size_header) }}
              >
                {config.header}
              </h2>
            )}
            {config.sub_header && (
              <p
                className="text-neutral-600"
                style={{ fontSize: sized(BASE_FONT_PX.sub_header, config.font_size_sub_header) }}
              >
                {config.sub_header}
              </p>
            )}

            <QRCodeSVG
              value={scanUrl}
              size={qrPx}
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
              includeMargin
            />

            <p
              className="text-neutral-500"
              style={{ fontSize: sized(BASE_FONT_PX.tagline, config.font_size_tagline) }}
            >
              {tagline}
            </p>
          </div>

          {/* Footer band */}
          {showFooterBand && (
            <div className="flex flex-col items-center gap-1 pb-6 text-center">
              {config.footer && (
                <p
                  className="text-neutral-700"
                  style={{ fontSize: sized(BASE_FONT_PX.footer, config.font_size_footer) }}
                >
                  {config.footer}
                </p>
              )}
              {config.footer2 && (
                <p
                  className="text-neutral-500"
                  style={{ fontSize: sized(BASE_FONT_PX.footer2, config.font_size_footer2) }}
                >
                  {config.footer2}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
