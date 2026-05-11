import { Suspense } from "react";

import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

import { TemplateGrid } from "./_components/TemplateGrid";

export const metadata = {
  title: "SOP Templates",
};

export default function TemplatesPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <Heading>SOP Templates</Heading>
        <Text className="mt-1.5 max-w-2xl">
          Download a starter template in Word format, fill in your facility-specific details,
          then upload it from the SOPs page to run it through the import pipeline.
        </Text>
      </header>

      <Suspense>
        <TemplateGrid />
      </Suspense>
    </div>
  );
}
