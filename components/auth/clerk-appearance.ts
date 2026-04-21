/**
 * Restyles Clerk's <SignIn /> / <SignUp /> to the Steel & Signal system:
 * teal brand, Chakra Petch display, Inter body, dc-* surface tokens.
 *
 * Clerk's appearance API has three layers. We use:
 *  - variables: CSS variables Clerk reads internally (color, radius, fonts)
 *  - elements: Tailwind class overrides on specific internal slots
 * Typed contextually at the call site via `<SignIn appearance={...}>`.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: "#14B8A6",
    colorText: "#0F1117",
    colorTextSecondary: "#4B5563",
    colorBackground: "#FFFFFF",
    colorInputBackground: "#FFFFFF",
    colorInputText: "#0F1117",
    colorDanger: "#EF4444",
    colorSuccess: "#10B981",
    colorWarning: "#F59E0B",
    colorNeutral: "#0F1117",
    borderRadius: "0.5rem",
    fontFamily: "var(--font-sans)",
    fontFamilyButtons: "var(--font-display)",
    fontSize: "0.9375rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox:
      "w-full shadow-none border border-dc-edge rounded-xl bg-dc-surface overflow-hidden",
    card: "bg-dc-surface shadow-none p-6 sm:p-7",
    header: "hidden",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    main: "gap-4",

    // Social buttons (OAuth)
    socialButtonsBlockButton:
      "min-h-11 border border-dc-edge bg-dc-surface text-dc-text font-semibold rounded-lg hover:bg-dc-raised transition-colors",
    socialButtonsBlockButtonText: "font-semibold",
    socialButtonsProviderIcon: "size-5",

    // Divider between social + email
    dividerLine: "bg-dc-edge",
    dividerText:
      "text-xs uppercase tracking-widest text-dc-text-3 font-mono font-medium",

    // Form fields
    formFieldLabel:
      "text-sm font-semibold text-dc-text tracking-tight",
    formFieldInput:
      "min-h-11 rounded-lg border border-dc-edge bg-dc-surface px-3.5 text-base text-dc-text placeholder:text-dc-text-3 focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/30 focus:outline-none transition",
    formFieldInputShowPasswordButton:
      "text-dc-text-2 hover:text-dc-text",
    formFieldAction:
      "text-sm font-semibold text-[var(--color-brand)] hover:underline underline-offset-4",
    formFieldErrorText:
      "text-sm text-[var(--color-signal-urgent)]",
    formFieldSuccessText:
      "text-sm text-[var(--color-signal-ok)]",
    formFieldHintText: "text-sm text-dc-text-2",

    // Primary submit button — teal, glove-friendly 44px min height
    formButtonPrimary:
      "min-h-11 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white font-display font-semibold tracking-wide rounded-lg shadow-[0_0_0_1px_rgba(15,118,110,0.2),0_1px_2px_rgba(15,23,42,0.08)] transition-colors normal-case text-sm",
    formButtonReset:
      "text-sm font-semibold text-dc-text-2 hover:text-dc-text",

    // OTP / verification code cells
    otpCodeFieldInput:
      "min-h-11 min-w-11 rounded-lg border border-dc-edge text-dc-text font-mono text-lg focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/30 focus:outline-none",

    // Identity preview card ("Not you?" row)
    identityPreview:
      "bg-dc-raised border border-dc-edge rounded-lg",
    identityPreviewText: "text-dc-text",
    identityPreviewEditButton:
      "text-[var(--color-brand)] hover:underline",

    // Alternative-method links
    alternativeMethodsBlockButton:
      "min-h-11 border border-dc-edge bg-dc-surface text-dc-text hover:bg-dc-raised rounded-lg font-semibold",

    // Footer
    footer: "bg-dc-surface",
    footerActionText: "text-sm text-dc-text-2",
    footerActionLink:
      "text-sm font-semibold text-[var(--color-brand)] hover:underline underline-offset-4",

    // Error / badge pills
    badge: "bg-[var(--color-brand-50)] text-[var(--color-brand-dim)]",
    formResendCodeLink:
      "text-sm font-semibold text-[var(--color-brand)] hover:underline underline-offset-4",

    // Modal / captcha containers
    modalContent: "bg-dc-surface border border-dc-edge",
    modalCloseButton: "text-dc-text-2 hover:text-dc-text",
  },
} as const;
