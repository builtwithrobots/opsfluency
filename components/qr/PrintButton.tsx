'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  label?: string;
}

export default function PrintButton({ label = 'Print QR Code' }: Props) {
  return (
    <>
      <Button type="button" onClick={() => window.print()} className="w-full">
        <Printer data-slot="icon" strokeWidth={2} />
        {label}
      </Button>

      {/* Print styles: hide everything except the QR sheet */}
      <style>{`
        @media print {
          body > *:not(#print-root) { display: none !important; }
          #qr-print-sheet {
            position: fixed !important;
            inset: 0 !important;
            width: 8.5in !important;
            height: 11in !important;
            margin: 0 !important;
            padding: 0.25in !important;
            transform: none !important;
          }
        }
      `}</style>
    </>
  );
}
