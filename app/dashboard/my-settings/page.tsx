import { UserCog } from "lucide-react";

import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export default function MySettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs font-medium tracking-[0.15em] text-(--color-brand) uppercase">
          Account
        </p>
        <Heading className="font-display mt-2">My Settings</Heading>
        <Text className="mt-2 max-w-2xl">
          Manage your personal account preferences, notification settings, and
          display options.
        </Text>
      </header>

      <div className="max-w-2xl rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-8 py-12">
        <div className="flex items-start gap-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--dc-edge)] bg-dc-raised">
            <UserCog className="size-5 text-dc-text-3" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-base font-semibold text-dc-text">
              Personal settings coming soon
            </p>
            <p className="mt-2 text-sm text-dc-text-3 max-w-md">
              Notification preferences, language settings, and display options
              will be available here in the next release.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
