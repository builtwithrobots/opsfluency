// v3.0.0
// Contact page. Blueprint refresh: ContactForm + ContactDirectChannels
// replaced by ContactBody (2-col framed form + sidebar). ContactHero
// updated to left-aligned Blueprint pattern.

import type { Metadata } from "next";

import { ContactBody } from "@/components/marketing/contact/ContactBody";
import { ContactFAQ } from "@/components/marketing/contact/ContactFAQ";
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
      <ContactBody />
      <ContactFAQ />
    </>
  );
}
