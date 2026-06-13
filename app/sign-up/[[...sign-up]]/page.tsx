import { SignUp } from "@clerk/nextjs";

import { AuthShell } from "@/components/auth/auth-shell";
import { clerkAppearance } from "@/components/auth/clerk-appearance";

export const metadata = {
  title: "Create an account — OpsFluency",
  description: "Spin up a bilingual SOP workspace for your facility in under a minute.",
};

export default function Page() {
  return (
    <AuthShell mode="sign-up">
      <SignUp appearance={clerkAppearance} forceRedirectUrl="/onboarding" />
    </AuthShell>
  );
}
