import type { Metadata } from "next";

import { ServicesHero } from "@/components/marketing/services/ServicesHero";
import { ServicesTierGrid } from "@/components/marketing/services/ServicesTierGrid";
import { ServicesComparison } from "@/components/marketing/services/ServicesComparison";
import { ServicesCTA } from "@/components/marketing/services/ServicesCTA";

export const metadata: Metadata = {
  title: "Services -- OpsFluency",
  description:
    "Three ways to work with Rob Ramos: Operations Consulting, Fractional Leadership, and Custom App Solutions. No pitch deck. No sales cycle. One conversation about your operation.",
};

export default function ServicesPage() {
  return (
    <>
      <ServicesHero />
      <ServicesTierGrid />
      <ServicesComparison />
      <ServicesCTA />
    </>
  );
}
