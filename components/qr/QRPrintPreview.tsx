'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
 * The visible sheet scales proportionally to fit its container.
 *
 * Print path: a second, unscaled copy of the sheet is portal-mounted at
 * document.body with id `qr-print-sheet`. It's display:none on screen and
 * display:block in @media print, so the print output is always the full-size
 * sheet without inheriting the on-screen scale or any clipping ancestors.
 *
 * Layout: three vertical bands (top / middle / bottom). The middle band
 * (header + QR + tagline) flex-grows so the QR stays optically centered
 * even when the top or bottom bands are empty.
 */
export default function QRPrintPreview({
  qrCodeId,
  config,
  companyName,
  logoUrl,
}: Props) {
  const wrapperRef          = useRef<HTMLDivElement>(null);
  const [scale, setScale]   = useState(1);
  const [mounted, setMounted] = useState(false);

  // Portal target only exists in the browser. Standard SSR-safe portal
  // mount: the portal copy renders only after first client effect.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

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
        {/* On-screen sheet — uses a class (not the print id) so the print
            CSS can target only the portal-mounted copy below. */}
        <QRSheet
          variant="screen"
          qrCodeId={qrCodeId}
          config={config}
          companyName={companyName}
          logoUrl={logoUrl}
        />
      </div>

      {/* Print-only sheet — portal-mounted at body so no ancestor transform
          or overflow:hidden interferes with @media print. */}
      {mounted && createPortal(
        <QRSheet
          variant="print"
          qrCodeId={qrCodeId}
          config={config}
          companyName={companyName}
          logoUrl={logoUrl}
        />,
        document.body,
      )}
    </div>
  );
}

/* ── Shared sheet markup ─────────────────────────────────────────────────── */

interface SheetProps {
  variant: 'screen' | 'print';
  qrCodeId: string;
  config: PrintConfig;
  companyName?: string;
  logoUrl?: string | null;
}

function QRSheet({ variant, qrCodeId, config, companyName, logoUrl }: SheetProps) {
  const scanUrl   = `${appUrl}/s/${qrCodeId}`;
  const qrPx      = Math.round((config.qr_size / 100) * SHEET_W * 0.7);
  const tagline   = TEMPLATE_TAGLINES[config.template];
  const fontStack = FONT_FAMILY_CSS[config.font_family];
  const sized     = (basePx: number, scalePct: number) =>
    Math.round(basePx * (scalePct / 100));

  const showLogo        = config.show_logo && !!logoUrl;
  const showCompanyName = config.show_company_name && !!companyName;
  const showTopBand     = showLogo || showCompanyName;
  const showFooterBand  = !!config.footer || !!config.footer2;

  const isPrint = variant === 'print';

  return (
    <div
      // The print copy carries the id targeted by PrintButton's @media print
      // CSS. The on-screen copy uses a class only.
      id={isPrint ? 'qr-print-sheet' : undefined}
      className={[
        'relative flex flex-col bg-white',
        isPrint
          ? 'qr-print-sheet-portal'
          : 'qr-print-sheet-screen h-full',
      ].join(' ')}
      style={{
        fontFamily: fontStack,
        padding:    GUIDE_INSET_PX,
        // Print copy gets explicit dimensions so it lays out at full size
        // even though its (body) parent doesn't constrain it.
        ...(isPrint ? { width: SHEET_W, height: SHEET_H } : null),
      }}
    >
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
  );
}
