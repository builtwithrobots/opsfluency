import { listTagsWithUsage } from "@/app/dashboard/tags/_actions/tags";
import { getCompanyContext } from "@/lib/auth/company-context";
import { Subheading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

import { LabelsClient } from "../_components/LabelsClient";

export async function LabelsTab() {
  await getCompanyContext("admin");
  const result = await listTagsWithUsage();

  if (!result.ok) {
    return (
      <p className="text-sm text-(--color-signal-urgent)">
        Failed to load labels: {result.error.message ?? result.error.code}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Subheading>Labels</Subheading>
        <Text className="mt-1 max-w-2xl">
          Labels attach to SOPs and glossary terms in both English and Spanish.
          Department labels are system-managed. Custom labels can be created, edited, and archived here.
        </Text>
      </div>
      <LabelsClient tags={result.data} />
    </div>
  );
}
