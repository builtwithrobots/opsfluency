import { ShieldCheck } from "lucide-react";

import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

import { SignOutButtonClient } from "../_components/SignOutButtonClient";

export function SecurityTab() {
  return (
    <section className="flex max-w-3xl flex-col gap-6">
      <div className="overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
        <div className="border-b border-[color:var(--dc-edge)] px-5 py-4">
          <Heading level={2} className="text-xl">
            Sign-in &amp; security
          </Heading>
          <Text className="mt-1 text-sm">
            Password, multi-factor auth, and active sessions are managed through
            your account portal.
          </Text>
        </div>

        <div className="flex items-start gap-4 px-5 py-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--dc-edge)] bg-dc-raised">
            <ShieldCheck className="size-5 text-dc-text-3" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-dc-text">
              Manage password &amp; MFA
            </p>
            <p className="mt-1 text-xs text-dc-text-3 max-w-md">
              Open your account portal from the avatar menu in the top-right of
              the dashboard, then choose “Manage account” to update your
              password, set up two-factor authentication, or review the devices
              currently signed in.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
        <div className="border-b border-[color:var(--dc-edge)] px-5 py-4">
          <Heading level={2} className="text-xl">
            Sign out
          </Heading>
          <Text className="mt-1 text-sm">
            Ends your session on this device.
          </Text>
        </div>

        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <p className="text-xs text-dc-text-3">
            Other devices stay signed in. To sign out everywhere, use “Manage
            account” in the avatar menu.
          </p>
          <SignOutButtonClient />
        </div>
      </div>
    </section>
  );
}
