// v1.0.0
// Features section 04: QR code system. Mockup shows an 8.5x11 printable
// sheet with a QR, header, and footer placeholders.

import { QrCode } from "lucide-react";

import { FeatureDetailRow } from "./FeatureDetailRow";

export function FeatureQRCodes() {
  return (
    <FeatureDetailRow
      id="qr-codes"
      headingId="features-qr-heading"
      side="left"
      eyebrow="04 - QR code system"
      icon={<QrCode className="h-5 w-5" strokeWidth={2} />}
      title="One permanent QR per procedure. Print it once. Mount it and move on."
      description="QR codes never change after generation. Update the SOP, edit the Spanish, re-review after an audit, the QR still works and always points to the live version. No re-printing, no mid-shift scavenger hunts."
      bullets={[
        "Letter-size printable layout with logo, header, and phone number.",
        "Live preview with size controls while you design the print sheet.",
        "Archive a procedure and the QR returns a friendly out-of-service page.",
      ]}
      mockupLabel="printable letter-size sheet with a QR, headline, and footer"
      mockup={
        <div className="mt-10 flex items-center justify-center">
          <div className="flex aspect-[8.5/11] w-44 flex-col items-center gap-3 rounded border border-dc-edge-2 bg-white p-3 shadow-sm md:w-52 md:gap-4 md:p-4">
            <div className="flex w-full items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-[var(--color-brand)]" />
              <div className="h-1.5 w-1/2 rounded-full bg-slate-300" />
            </div>
            <div className="h-1.5 w-3/4 rounded-full bg-slate-900" />
            <div className="aspect-square w-24 rounded border-2 border-slate-900 bg-white p-2 md:w-28">
              <div
                className="grid h-full w-full grid-cols-5 grid-rows-5 gap-0.5"
                aria-hidden="true"
              >
                {Array.from({ length: 25 }, (_, i) => (
                  <div
                    key={i}
                    className={
                      [0, 4, 6, 7, 10, 12, 13, 17, 18, 20, 22, 24].includes(i)
                        ? "bg-slate-900"
                        : "bg-transparent"
                    }
                  />
                ))}
              </div>
            </div>
            <div className="flex w-full flex-col items-center gap-1">
              <div className="h-1 w-2/3 rounded-full bg-slate-300" />
              <div className="h-1 w-1/2 rounded-full bg-slate-300" />
            </div>
          </div>
        </div>
      }
    />
  );
}
