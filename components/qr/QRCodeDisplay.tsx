'use client';

import { QRCodeSVG } from 'qrcode.react';
import { TEMPLATE_TAGLINES, type PrintConfig } from '@/lib/qr/print-config';

interface Props {
  qrCodeId: string;
  config: PrintConfig;
  companyName?: string;
  logoUrl?: string | null;
  /** Width in px — the QR SVG fills this square. */
  size?: number;
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

export default function QRCodeDisplay({
  qrCodeId,
  config,
  companyName,
  logoUrl,
  size = 200,
}: Props) {
  const scanUrl = `${appUrl}/s/${qrCodeId}`;
  const tagline = TEMPLATE_TAGLINES[config.template];

  return (
    <div className="flex flex-col items-center gap-3">
      {config.show_logo && logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={companyName ?? 'Company logo'}
          className="max-h-12 max-w-[160px] object-contain"
        />
      )}
      {config.show_logo && !logoUrl && companyName && (
        <span className="text-sm font-semibold text-neutral-200">{companyName}</span>
      )}

      <QRCodeSVG
        value={scanUrl}
        size={size}
        bgColor="#ffffff"
        fgColor="#000000"
        level="M"
        includeMargin
      />

      <p className="text-center text-xs text-neutral-400">{tagline}</p>
    </div>
  );
}
