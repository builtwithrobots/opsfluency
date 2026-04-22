'use client';

interface Props {
  label?: string;
}

export default function PrintButton({ label = 'Print QR Code' }: Props) {
  return (
    <>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.75 19.5a2.25 2.25 0 004.5 0V13.829m0 0c.24.03.48.062.72.096m-.72-.096V19.5a2.25 2.25 0 004.5 0v-5.671"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 6.75h.75m-.75 3h.75m6.75-3h.75m-.75 3h.75m-6.75 6h6.75M6.75 6A2.25 2.25 0 004.5 8.25v7.5A2.25 2.25 0 006.75 18h10.5A2.25 2.25 0 0019.5 15.75v-7.5A2.25 2.25 0 0017.25 6H6.75z"
          />
        </svg>
        {label}
      </button>

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
