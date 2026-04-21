import { AlertTriangle } from "lucide-react";

/**
 * Rendered when `getCompanyContext()` finds a `company_members` row via the
 * admin client but not via the user's Clerk-JWT-authenticated client.
 *
 * That mismatch means the Clerk ↔ Supabase third-party auth bridge isn't
 * validating the token — Supabase drops it, the caller is treated as anon,
 * and RLS hides every row. This page surfaces the exact fix instead of
 * dead-ending on a generic server error.
 */
interface AuthBridgeErrorProps {
  detail?: string;
}

export function AuthBridgeError({ detail }: AuthBridgeErrorProps) {
  const clerkDomain = process.env.NEXT_PUBLIC_CLERK_FRONTEND_API_URL;

  return (
    <div className="min-h-screen bg-dc-bg px-6 py-16">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-10 items-center justify-center rounded-lg bg-(--color-signal-urgent)/15 text-(--color-signal-urgent)"
          >
            <AlertTriangle className="size-5" />
          </span>
          <div>
            <p className="text-xs font-medium tracking-[0.15em] text-(--color-signal-urgent) uppercase">
              Setup incomplete
            </p>
            <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-dc-text">
              Supabase isn&apos;t trusting your Clerk session.
            </h1>
          </div>
        </div>

        <div className="rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-6 text-sm text-dc-text-2 shadow-xs">
          <p>
            Your company and admin record exist in the database, but the
            signed-in browser can&apos;t read them. That means the Clerk JWT
            this session sends with every Supabase request is being rejected —
            which happens when Supabase&apos;s Third-party Auth → Clerk
            provider isn&apos;t configured (or points at a different Clerk
            instance).
          </p>

          <h2 className="mt-6 font-display text-sm font-semibold tracking-[0.05em] text-dc-text uppercase">
            Fix
          </h2>
          <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5">
            <li>
              Supabase dashboard → <strong>Authentication → Sign In / Providers → Third-party Auth</strong>.
            </li>
            <li>
              Add (or edit) the <strong>Clerk</strong> provider.
            </li>
            <li>
              Paste your Clerk <strong>Frontend API URL</strong> into the
              Domain field. From this deploy that value is:
              <code className="mt-2 block rounded-md bg-dc-raised px-3 py-2 font-mono text-xs text-dc-text">
                {clerkDomain ?? "(NEXT_PUBLIC_CLERK_FRONTEND_API_URL not set — copy from Clerk dashboard → API keys → Frontend API)"}
              </code>
            </li>
            <li>Save, then reload this page.</li>
          </ol>

          {detail ? (
            <details className="mt-6 rounded-md border border-[color:var(--dc-edge)] bg-dc-raised/40 p-3 text-xs text-dc-text-3">
              <summary className="cursor-pointer font-medium text-dc-text-2">
                Technical detail
              </summary>
              <p className="mt-2 break-all font-mono">{detail}</p>
            </details>
          ) : null}
        </div>

        <p className="text-xs text-dc-text-3">
          If you&apos;re seeing this page in production, no user-facing routes
          are reachable until the bridge is configured. Employees who scan a
          QR code will still be redirected to sign in, but won&apos;t be able
          to load an SOP afterward.
        </p>
      </div>
    </div>
  );
}
