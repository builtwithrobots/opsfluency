import { ShieldCheck } from "lucide-react";

import { stopImpersonation } from "@/app/dashboard/_actions/impersonation";

interface ImpersonationBannerProps {
  companyName: string;
}

/**
 * Sticky warning banner rendered above every `/dashboard/*` route while
 * a super admin is impersonating a tenant. Exists to make it impossible
 * to forget which tenant's data you're touching — no ambient tab title
 * cue, no sidebar chrome difference, this banner is it.
 */
export function ImpersonationBanner({ companyName }: ImpersonationBannerProps) {
  return (
    <div
      role="status"
      className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-(--color-signal-warn)/40 bg-(--color-signal-warn)/10 px-4 py-2 text-sm text-(--color-signal-warn) backdrop-blur"
    >
      <span className="flex items-center gap-2 font-medium">
        <ShieldCheck className="size-4" strokeWidth={2} aria-hidden />
        Impersonating <span className="font-semibold">{companyName}</span> as
        super admin
      </span>
      <form action={stopImpersonation}>
        <button
          type="submit"
          className="rounded-md border border-(--color-signal-warn)/40 bg-(--color-signal-warn)/15 px-3 py-1 text-xs font-semibold tracking-wide uppercase hover:bg-(--color-signal-warn)/25"
        >
          Exit impersonation
        </button>
      </form>
    </div>
  );
}
