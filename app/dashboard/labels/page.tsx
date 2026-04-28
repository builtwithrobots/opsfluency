import { listTagsWithUsage } from "@/app/dashboard/tags/_actions/tags";
import { getCompanyContext } from "@/lib/auth/company-context";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

import { LabelsClient } from "./_components/LabelsClient";

export default async function LabelsPage() {
  await getCompanyContext("admin");
  const result = await listTagsWithUsage();

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-6">
        <header>
          <Heading>Labels</Heading>
        </header>
        <p className="text-sm text-(--color-signal-urgent)">
          Failed to load labels: {result.error.message ?? result.error.code}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Heading>Labels</Heading>
        <Text className="mt-1.5 max-w-2xl">
          Bilingual labels attach to SOPs and glossary terms. Department labels
          are system-managed. Custom labels can be created, edited, and archived.
        </Text>
      </header>

      <LabelsClient tags={result.data} />
    </div>
  );
}
