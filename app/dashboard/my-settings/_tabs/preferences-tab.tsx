import { BellRing, CheckCircle2 } from "lucide-react";

import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getCompanyContext } from "@/lib/auth/company-context";
import type { WorkerLanguage } from "@/lib/types/sop";

import { LanguageSegmentedClient } from "../_components/LanguageSegmentedClient";

interface Props {
  saved?: boolean;
}

export async function PreferencesTab({ saved }: Props) {
  const { userId, supabase, company_id } = await getCompanyContext();

  const { data: member } = await supabase
    .from("company_members")
    .select("preferred_language")
    .eq("clerk_user_id", userId)
    .eq("company_id", company_id)
    .single();

  const current: WorkerLanguage =
    member?.preferred_language === "es" ? "es" : "en";

  return (
    <section className="flex max-w-3xl flex-col gap-6">
      {saved ? (
        <div className="flex items-center gap-2 rounded-lg border border-(--color-signal-ok)/30 bg-(--color-signal-ok)/10 px-4 py-3 text-sm font-medium text-(--color-signal-ok)">
          <CheckCircle2 className="size-4 shrink-0" strokeWidth={2} />
          Language preference saved.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
        <div className="border-b border-[color:var(--dc-edge)] px-5 py-4">
          <Heading level={2} className="text-xl">
            Language
          </Heading>
          <Text className="mt-1 text-sm">
            Used across the worker app and saved to your account so it follows
            you to any device.
          </Text>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div className="min-w-0">
            <p className="text-sm font-medium text-dc-text">Preferred language</p>
            <p className="mt-1 text-xs text-dc-text-3">
              Affects procedures and announcements in the worker app today. The
              dashboard interface will follow in a future release.
            </p>
          </div>
          <LanguageSegmentedClient current={current} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-5 py-5">
        <div className="flex items-start gap-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--dc-edge)] bg-dc-raised">
            <BellRing className="size-4 text-dc-text-3" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-semibold text-dc-text">
              Notifications coming soon
            </p>
            <p className="mt-1 text-xs text-dc-text-3 max-w-md">
              Email alerts for new submissions, SOPs awaiting approval, and
              re-translation flags will land here.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
