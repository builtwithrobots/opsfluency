import { SignIn } from "@clerk/nextjs";

import { AuthShell } from "@/components/auth/auth-shell";
import { clerkAppearance } from "@/components/auth/clerk-appearance";

export const metadata = {
  title: "Sign in — OpsFluency",
  description: "Sign in to manage bilingual SOPs, announcements, and departments.",
};

export default function Page() {
  return (
    <AuthShell mode="sign-in">
      <SignIn appearance={clerkAppearance} />
    </AuthShell>
  );
}
