'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  label?: string;
}

/**
 * Triggers the browser print dialog and ships the @media print styles that
 * isolate the QR sheet. The sheet itself is portal-mounted at document.body
 * by QRPrintPreview as `<div id="qr-print-sheet" class="qr-print-sheet-portal">`,
 * so the print rules don't have to fight ancestor transforms or overflow.
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
           interactive preview should be visible during editing. */
        .qr-print-sheet-portal { display: none; }

        @media print {
          @page {
            size: 8.5in 11in;
            margin: 0;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          /* Hide everything in the document, then re-show only the print
             sheet and its descendants. visibility (not display) so the
             sheet's layout survives. */
          body * { visibility: hidden !important; }
          #qr-print-sheet, #qr-print-sheet * { visibility: visible !important; }

          /* Position the sheet at the page origin at full 8.5×11in. */
          #qr-print-sheet {
            display: flex !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 8.5in !important;
            height: 11in !important;
            margin: 0 !important;
            padding: 0.25in !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
        }
      `}</style>
    </>
  );
}
