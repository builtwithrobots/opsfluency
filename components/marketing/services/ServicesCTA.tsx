// v1.0.0
import { CTABlock } from "@/components/marketing/CTABlock";
import { Button } from "@/components/marketing/Button";

export function ServicesCTA() {
  return (
    <CTABlock
      ariaLabel="Get in touch with Rob"
      heading="Not sure which fits?"
      subhead="Most people who reach out are not sure which option is right yet. That is exactly what the first conversation figures out. No commitment, no pressure, no pitch deck."
      primary={
        <Button href="/contact" variant="primary" size="lg">
          Talk to Rob
        </Button>
      }
      secondary={
        <Button
          href="https://app.opsfluency.com"
          variant="secondary"
          size="lg"
          target="_blank"
          rel="noopener noreferrer"
        >
          See the platform
        </Button>
      }
    />
  );
}
