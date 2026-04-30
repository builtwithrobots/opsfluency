import type { Metadata } from "next";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export const metadata: Metadata = {
  title: "Terms of Service · OpsFluency",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Heading>Terms of Service</Heading>
      <Text className="mt-4">
        Our full terms of service are coming soon. For questions, contact us at{" "}
        <a href="mailto:hello@opsfluency.com" className="underline">
          hello@opsfluency.com
        </a>
        .
      </Text>
    </div>
  );
}
