'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  FONT_FAMILY_CSS,
  TEMPLATE_TAGLINES,
  TEMPLATE_TAGLINES_ES,
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
        {/* On-screen sheet - uses a class (not the print id) so the print
            CSS can target only the portal-mounted copy below. */}
        <QRSheet
          variant="screen"
          qrCodeId={qrCodeId}
          config={config}
          companyName={companyName}
          logoUrl={logoUrl}
        />
      </div>

      {/* Print-only sheet - portal-mounted at body so no ancestor transform
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
  const fontStack = FONT_FAMILY_CSS[config.font_family];
  const sized     = (basePx: number, scalePct: number) =>
    Math.round(basePx * (scalePct / 100));

  const isEs      = config.lang === 'es';
  const header    = isEs ? config.header_es    : config.header;
  const subHeader = isEs ? config.sub_header_es : config.sub_header;
  const footer    = isEs ? config.footer_es    : config.footer;
  const footer2   = isEs ? config.footer2_es   : config.footer2;
  // Tagline: use the per-QR override first, then the template default.
  const tagline   = isEs
    ? (config.tagline_es || TEMPLATE_TAGLINES_ES[config.template])
    : (config.tagline    || TEMPLATE_TAGLINES[config.template]);

  const showLogo        = config.show_logo && !!logoUrl;
  const showCompanyName = config.show_company_name && !!companyName;
  const showTopBand     = showLogo || showCompanyName;
  const showFooterBand  = !!footer || !!footer2;
  const showTagline     = !!tagline;
  const logoMaxH        = sized(64, config.logo_size);
  const logoMaxW        = sized(220, config.logo_size);

  const isPrint = variant === 'print';

  return (
    <div
      // The print copy carries the id targeted by PrintButton's @media print
      // CSS. The on-screen copy uses a class only. The portal copy is hidden
      // on screen via Tailwind's `hidden` (= display:none); PrintButton's
      // @media print rule overrides with `display: flex !important` while
      // printing, so the print path is unaffected.
      id={isPrint ? 'qr-print-sheet' : undefined}
      lang={isEs ? 'es' : 'en'}
      className={[
        'relative flex flex-col bg-white',
        isPrint
          ? 'qr-print-sheet-portal hidden'
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
        data-print-guide
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
        <div
          className="flex flex-col items-center pt-6"
          style={{ gap: config.spacing_top }}
        >
          {showLogo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl!}
              alt={companyName ?? 'Company logo'}
              className="object-contain"
              style={{ maxHeight: logoMaxH, maxWidth: logoMaxW }}
            />
          )}
          {showCompanyName && (
            <p
              className={`text-neutral-800 ${config.bold_company_name ? 'font-bold' : 'font-normal'}`}
              style={{ fontSize: sized(BASE_FONT_PX.company_name, config.font_size_company_name) }}
            >
              {companyName}
            </p>
          )}
        </div>
      )}

      <div
        className="flex flex-1 flex-col items-center justify-center px-6 text-center"
        style={{ gap: config.spacing_middle }}
      >
        {header && (
          <h2
            className={`text-neutral-900 leading-tight ${config.bold_header ? 'font-bold' : 'font-normal'}`}
            style={{ fontSize: sized(BASE_FONT_PX.header, config.font_size_header) }}
          >
            {header}
          </h2>
        )}
        {subHeader && (
          <p
            className={`text-neutral-600 ${config.bold_sub_header ? 'font-bold' : 'font-normal'}`}
            style={{ fontSize: sized(BASE_FONT_PX.sub_header, config.font_size_sub_header) }}
          >
            {subHeader}
          </p>
        )}

        {/* QR + tagline form one visual cluster with a tight fixed gap so
            the tagline reads as a caption to the code, not as another
            independent line. The middle band's spacing_middle still
            governs distance between header / sub-header / this cluster. */}
        <div className="flex flex-col items-center" style={{ gap: 6 }}>
          <QRCodeSVG
            value={scanUrl}
            size={qrPx}
            bgColor="#ffffff"
            fgColor="#000000"
            level="M"
            includeMargin
          />

          {showTagline && (
            <p
              className={`text-neutral-500 ${config.bold_tagline ? 'font-bold' : 'font-normal'}`}
              style={{ fontSize: sized(BASE_FONT_PX.tagline, config.font_size_tagline) }}
            >
              {tagline}
            </p>
          )}
        </div>
      </div>

      {showFooterBand && (
        <div
          className="flex flex-col items-center pb-6 text-center"
          style={{ gap: config.spacing_footer }}
        >
          {footer && (
            <p
              className={`text-neutral-700 ${config.bold_footer ? 'font-bold' : 'font-normal'}`}
              style={{ fontSize: sized(BASE_FONT_PX.footer, config.font_size_footer) }}
            >
              {footer}
            </p>
          )}
          {footer2 && (
            <p
              className={`text-neutral-500 ${config.bold_footer2 ? 'font-bold' : 'font-normal'}`}
              style={{ fontSize: sized(BASE_FONT_PX.footer2, config.font_size_footer2) }}
            >
              {footer2}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
