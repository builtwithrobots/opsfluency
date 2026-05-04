import { AuthError, getCompanyContext } from "@/lib/auth/company-context";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { HrContactsClient, type HrContactRow } from "./_components/HrContactsClient";

export default async function HrContactsPage() {
  let contacts: HrContactRow[] = [];

  try {
    const { supabase, company_id } = await getCompanyContext("admin");

    const { data } = await supabase
      .from("hr_contacts")
      .select("id, name, title, email, phone, photo_url, sort_order")
      .eq("company_id", company_id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    contacts = (data ?? []) as HrContactRow[];
  } catch (e) {
    if (e instanceof AuthError) throw e;
    // hr_contacts table not yet migrated — show empty state
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Heading>HR Contacts</Heading>
        <Text className="mt-1.5 max-w-2xl">
          These contacts appear as cards at the bottom of every SOP using the{" "}
          <span className="font-medium text-emerald-400">Onboarding</span> template — so new hires
          always know who to ask.
        </Text>
      </header>

      <HrContactsClient initial={contacts} />
    </div>
  );
}
