// v1.0.0
// Features section 06: monitor system. Mockup shows a landscape TV
// frame with departmental content blocks and a live heartbeat dot.

import { MonitorSmartphone } from "lucide-react";

import { FeatureDetailRow } from "./FeatureDetailRow";

export function FeatureMonitors() {
  return (
    <FeatureDetailRow
      id="monitors"
      headingId="features-monitors-heading"
      side="left"
      eyebrow="06 - Monitor system"
      icon={<MonitorSmartphone className="h-5 w-5" strokeWidth={2} />}
      title="Pair a TV in 30 seconds. Departmental updates play on the floor."
      description="Plug a browser into any display, pair it from your dashboard via QR, and the monitor serves content scoped to that department automatically. Runs for months without intervention. Heartbeat indicator in the footer so you know it's alive."
      bullets={[
        "QR pairing, no login on the TV itself.",
        "Auto-refresh built in. No kiosk mode hacks required.",
        "Signed HttpOnly cookie scopes content to one department.",
      ]}
      mockupLabel="landscape TV showing departmental announcements and a live indicator"
      mockup={
        <div className="mt-10 flex items-center justify-center">
          <div className="aspect-video w-64 overflow-hidden rounded-md border-4 border-dc-text bg-dc-text md:w-72">
            <div className="flex h-full flex-col gap-2 bg-[#0C0E14] p-3 text-white">
              <div className="flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-widest text-[var(--color-brand)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  <span
                    aria-hidden="true"
                    className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-signal-live)] animate-heartbeat"
                  />
                  Safety
                </span>
                <span
                  className="text-[9px] font-semibold uppercase tracking-widest text-white/60"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  09:41
                </span>
              </div>
              <div className="h-2 w-3/4 rounded-full bg-white" />
              <div className="h-1.5 w-5/6 rounded-full bg-white/70" />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="rounded bg-white/5 p-2">
                  <div className="h-1 w-1/2 rounded-full bg-white/60" />
                  <div className="mt-1.5 h-2 w-3/4 rounded-full bg-white" />
                </div>
                <div className="rounded bg-white/5 p-2">
                  <div className="h-1 w-1/2 rounded-full bg-white/60" />
                  <div className="mt-1.5 h-2 w-2/3 rounded-full bg-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}
