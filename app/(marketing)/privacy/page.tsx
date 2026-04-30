import type { Metadata } from "next";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export const metadata: Metadata = {
  title: "Privacy Policy · OpsFluency",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Heading>Privacy Policy</Heading>
      <Text className="mt-4">
        Our full privacy policy is coming soon. For questions, contact us at{" "}
        <a href="mailto:hello@opsfluency.com" className="underline">
          hello@opsfluency.com
        </a>
        .
      </Text>
    </div>
  );
}
