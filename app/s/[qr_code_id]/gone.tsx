'use client';

// Renders as HTTP 410 Gone. Shown when a QR code's target has been archived.
// The parent server component returns this; Next.js serves it with status 200
// by default, so we override via the not-found convention below.
// To truly emit 410 we use a custom `not-found.tsx` + `generateStaticParams`
// approach would require extra infra; for MVP, the friendly page is enough
// and search engines won't cache a QR scan URL anyway (robots: noindex).

export default function QrGone() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
      </div>

      <h1 className="mb-2 text-2xl font-semibold text-white">
        This procedure is no longer available
      </h1>
      <p className="mb-1 text-base text-neutral-400">
        Ask your manager for the updated QR code or procedure location.
      </p>

      {/* Spanish */}
      <p className="text-base text-neutral-500" lang="es">
        Este procedimiento ya no está disponible. Consulte a su supervisor.
      </p>
    </main>
  );
}
