// v1.0.0
// Features section 07: HR module. Mockup shows an HR chat thread with
// worker message, HR reply, and a small contact card beside it.

import { MessageSquare } from "lucide-react";

import { FeatureDetailRow } from "./FeatureDetailRow";

export function FeatureHRModule() {
  return (
    <FeatureDetailRow
      id="hr-module"
      headingId="features-hr-heading"
      side="right"
      eyebrow="07 - HR module"
      icon={<MessageSquare className="h-5 w-5" strokeWidth={2} />}
      title="HR policies, contacts, and a direct line to the right human."
      description="Workers already scan QR codes to read SOPs. The HR department shows up the same way. Policies on the left, contacts on the right, and a chat thread that lets a worker ask a payroll question without leaving the floor."
      bullets={[
        "Onboarding, PTO, and benefits SOPs alongside the rest of your content.",
        "Contact cards with name, title, phone, and email.",
        "One-to-one chat threads scoped to the worker and the HR rep.",
      ]}
      mockupLabel="HR chat thread between a worker and HR, with a contact card"
      mockup={
        <div className="mt-10 grid grid-cols-[1fr_auto] items-start gap-3">
          <div className="flex flex-col gap-2">
            <div className="max-w-[80%] self-start rounded-xl rounded-bl-sm border border-dc-edge bg-dc-surface px-3 py-2">
              <div className="h-1 w-16 rounded-full bg-dc-text-2" />
              <div className="mt-1 h-1 w-24 rounded-full bg-dc-text-2" />
              <div className="mt-1 h-1 w-20 rounded-full bg-dc-text-2" />
            </div>
            <div className="max-w-[80%] self-end rounded-xl rounded-br-sm bg-[var(--color-brand)] px-3 py-2 text-white">
              <div className="h-1 w-20 rounded-full bg-white/85" />
              <div className="mt-1 h-1 w-28 rounded-full bg-white/85" />
              <div className="mt-1 h-1 w-16 rounded-full bg-white/85" />
            </div>
            <div className="max-w-[80%] self-start rounded-xl rounded-bl-sm border border-dc-edge bg-dc-surface px-3 py-2">
              <div className="h-1 w-24 rounded-full bg-dc-text-2" />
              <div className="mt-1 h-1 w-20 rounded-full bg-dc-text-2" />
            </div>
          </div>
          <div className="flex w-32 flex-col gap-2 rounded border border-dc-edge bg-dc-surface p-3">
            <div className="h-8 w-8 rounded-full bg-[color-mix(in_srgb,var(--color-brand)_25%,transparent)]" />
            <div className="h-1.5 w-3/4 rounded-full bg-dc-text" />
            <div className="h-1 w-1/2 rounded-full bg-dc-text-2" />
            <div className="mt-2 flex flex-col gap-1">
              <div className="h-1 w-5/6 rounded-full bg-dc-edge-2" />
              <div className="h-1 w-2/3 rounded-full bg-dc-edge-2" />
            </div>
          </div>
        </div>
      }
    />
  );
}
