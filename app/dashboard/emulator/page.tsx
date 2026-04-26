import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getCompanyContext } from "@/lib/auth/company-context";
import type { WorkerLanguage } from "@/lib/types/sop";

import { EmulatorClient } from "./_components/EmulatorClient";

export const metadata = {
  title: "Worker app emulator · OpsFluency",
};

/**
 * Worker app emulator. Available to admin and manager (and to super
 * admins via active impersonation, since impersonation is what gives
 * them a `company_id` to view). The page is a thin server entry that
 * resolves the viewer's preferred starting language; the iframe
 * itself is a client component.
 *
 * The emulator is *not* "view as a specific employee" — that's a
 * privacy-sensitive feature (HR chat, submissions) deferred to a
 * separate PR with an audit-log model.
 */
export default async function EmulatorPage() {
  // Manager-or-better. Admin always satisfies; impersonating super
  // admins resolve as role='admin'.
  const { userId, supabase, company_id } = await getCompanyContext("manager");

  const { data: member } = await supabase
    .from("company_members")
    .select("preferred_language")
    .eq("clerk_user_id", userId)
    .eq("company_id", company_id)
    .maybeSingle();

  const initialLang: WorkerLanguage =
    member?.preferred_language === "es" ? "es" : "en";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-medium tracking-[0.15em] text-(--color-brand) uppercase">
          Tools
        </p>
        <Heading className="font-display">Worker app emulator</Heading>
        <Text className="max-w-2xl">
          Preview what employees see in the worker PWA. Changes you make
          on the dashboard appear here on reload, useful for verifying
          a published SOP renders correctly before sharing the QR code.
        </Text>
      </header>

      <EmulatorClient initialLang={initialLang} />
    </div>
  );
}
