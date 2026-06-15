// v2.0.0
// Contact page. Metadata updated: no "SDR" language. Components
// unchanged in composition; copy updates live inside each component.

import type { Metadata } from "next";

import { ContactDirectChannels } from "@/components/marketing/contact/ContactDirectChannels";
import { ContactFAQ } from "@/components/marketing/contact/ContactFAQ";
import { ContactForm } from "@/components/marketing/contact/ContactForm";
import { ContactHero } from "@/components/marketing/contact/ContactHero";

export const metadata: Metadata = {
  title: "Contact OpsFluency: talk to Rob directly",
  description:
    "No qualification form. Send a note or email Rob directly. Reply within one business day.",
  openGraph: {
    title: "Contact OpsFluency",
    description:
      "Talk to the person who built the product. No qualification form.",
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <>
      <ContactHero />
      <ContactForm />
      <ContactDirectChannels />
      <ContactFAQ />
    </>
  );
}
