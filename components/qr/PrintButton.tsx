'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  label?: string;
}

/**
 * Triggers the browser print dialog and ships the @media print styles that
 * isolate the QR sheet. The sheet itself is portal-mounted at document.body
 * by QRPrintPreview as a direct child of <body> with id="qr-print-sheet" and
 * the .qr-print-sheet-portal class. Print rules collapse every other body
 * child via display:none so the page is exactly one 8.5×11in sheet, no
 * matter how tall the surrounding dashboard chrome is.
 */
export default function PrintButton({ label = 'Print QR Code' }: Props) {
  return (
    <>
      <Button type="button" onClick={() => window.print()} className="w-full">
        <Printer data-slot="icon" strokeWidth={2} />
        {label}
      </Button>

      <style>{`
        /* Hide the print-only portal copy on screen — only the scaled,
           interactive preview is visible during editing. */
        .qr-print-sheet-portal { display: none; }

        @media print {
          @page {
            size: 8.5in 11in;
            margin: 0;
          }

          /* Collapse the document to exactly one sheet. Using display:none
             (not visibility:hidden) means the dashboard chrome doesn't take
             up layout, so the browser doesn't paginate and reprint the
             fixed sheet across multiple pages. */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 8.5in !important;
            height: 11in !important;
            background: #ffffff !important;
          }
          body > *:not(#qr-print-sheet) { display: none !important; }

          #qr-print-sheet {
            display: flex !important;
            position: static !important;
            width: 8.5in !important;
            height: 11in !important;
            margin: 0 !important;
            padding: 0.25in !important;
            box-sizing: border-box !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }

          /* The 0.25in faint border is an editor affordance, not a printed
             mark. Drop it from the printed sheet. */
          #qr-print-sheet [data-print-guide] { display: none !important; }
        }
      `}</style>
    </>
  );
}
