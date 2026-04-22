// v1.0.0
// Contact page. Hero, form, direct channels, short FAQ. No final
// CTABlock: the form itself is the CTA, and a second CTA after it
// would be noise.

import type { Metadata } from "next";

import { ContactDirectChannels } from "@/components/marketing/contact/ContactDirectChannels";
import { ContactFAQ } from "@/components/marketing/contact/ContactFAQ";
import { ContactForm } from "@/components/marketing/contact/ContactForm";
import { ContactHero } from "@/components/marketing/contact/ContactHero";

export const metadata: Metadata = {
  title: "Contact OpsFluency: talk to Rob directly",
  description:
    "No SDR, no qualification form. Send a note or email Rob directly. Reply within one business day.",
  openGraph: {
    title: "Contact OpsFluency",
    description:
      "Talk to the person who built the product. No SDR. No qualification form.",
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
