// v1.0.0
// Features section 05: worker PWA. Mockup shows a phone frame with an
// SOP open and an offline indicator.

import { Smartphone, WifiOff } from "lucide-react";

import { FeatureDetailRow } from "./FeatureDetailRow";

export function FeatureWorkerPWA() {
  return (
    <FeatureDetailRow
      id="worker-pwa"
      headingId="features-pwa-heading"
      side="right"
      eyebrow="05 - Worker PWA"
      icon={<Smartphone className="h-5 w-5" strokeWidth={2} />}
      title="No app store. No passwords. Works when the wifi doesn't."
      description="Workers tap a magic link once and they're in. The last 20 SOPs they viewed stay cached on the device, so when the warehouse wifi drops to one bar they're still reading the right procedure in the right language."
      bullets={[
        "Magic-link sign-in via email or text. No passwords ever.",
        "Service worker caches recent SOPs and announcements for offline use.",
        "Add to Home Screen prompt turns it into a one-tap app.",
      ]}
      mockupLabel="worker phone with an SOP open and an offline indicator"
      mockup={
        <div className="mt-10 flex items-center justify-center">
          <div className="flex aspect-[9/16] w-40 flex-col overflow-hidden rounded-[1.25rem] border-4 border-dc-text bg-dc-surface md:w-44">
            <div className="flex items-center justify-between bg-dc-overlay px-3 py-1.5 text-[10px] text-dc-text-2">
              <span
                className="font-mono"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                9:41
              </span>
              <span className="inline-flex items-center gap-1">
                <WifiOff className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                <span
                  className="text-[9px] font-semibold uppercase tracking-widest"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  offline
                </span>
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-2 p-3">
              <div className="h-1.5 w-1/3 rounded-full bg-[var(--color-brand)]" />
              <div className="h-2 w-4/5 rounded-full bg-dc-text" />
              <div className="h-2 w-3/5 rounded-full bg-dc-text" />
              <div className="mt-2 flex flex-col gap-1.5">
                <div className="h-0.5 w-full rounded-full bg-dc-edge-2" />
                <div className="h-0.5 w-5/6 rounded-full bg-dc-edge-2" />
                <div className="h-0.5 w-full rounded-full bg-dc-edge-2" />
                <div className="h-0.5 w-3/4 rounded-full bg-dc-edge-2" />
              </div>
              <div
                className="mt-2 rounded border border-[color-mix(in_srgb,var(--color-signal-urgent)_25%,transparent)] bg-[color-mix(in_srgb,var(--color-signal-urgent)_12%,transparent)] p-1.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--color-signal-urgent)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Lockout required
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}
