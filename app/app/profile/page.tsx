import { User as UserIcon } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";

import { LanguageToggleClient } from "@/app/app/home/_components/LanguageToggleClient";
import { getCompanyContext } from "@/lib/auth/company-context";
import type { WorkerLanguage } from "@/lib/types/sop";

import { SignOutClient } from "./_components/SignOutClient";
import { EmailSectionClient } from "./_components/EmailSectionClient";
import { PasswordSectionClient } from "./_components/PasswordSectionClient";

interface Props {
  searchParams: Promise<{ lang?: string }>;
}

export const metadata = {
  robots: "noindex",
  title: "Profile · OpsFluency",
};

const STRINGS = {
  en: {
    eyebrow: "Profile",
    languageHeading: "Language",
    languageHint: "Used for procedures, announcements, and the app.",
    accountHeading: "Account",
    emailHeading: "Email address",
    passwordHeading: "Password",
    passwordHint: "Used to sign in with email + password as an alternative to magic links.",
    signOut: "Sign out",
    signOutAria: "Sign out",
  },
  es: {
    eyebrow: "Perfil",
    languageHeading: "Idioma",
    languageHint: "Se usa para procedimientos, anuncios y la app.",
    accountHeading: "Cuenta",
    emailHeading: "Correo electrónico",
    passwordHeading: "Contraseña",
    passwordHint: "Para iniciar sesión con correo y contraseña en lugar de enlaces mágicos.",
    signOut: "Cerrar sesión",
    signOutAria: "Cerrar sesión",
  },
} as const;

export default async function WorkerProfilePage({ searchParams }: Props) {
  const sp = await searchParams;
  const { userId, supabase, company_id } = await getCompanyContext();

  const [{ data: member }, user] = await Promise.all([
    supabase
      .from("company_members")
      .select("preferred_language")
      .eq("clerk_user_id", userId)
      .eq("company_id", company_id)
      .maybeSingle(),
    currentUser(),
  ]);

  const persisted: WorkerLanguage =
    member?.preferred_language === "es" ? "es" : "en";
  const lang: WorkerLanguage =
    sp.lang === "es" ? "es" : sp.lang === "en" ? "en" : persisted;
  const t = STRINGS[lang];

  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null;
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  // hasPassword and hasEmail are passed server-side so the client components
  // have the right initial state without an extra useUser() load flash.
  const hasEmail = !!email;

  return (
    <main
      className="mx-auto min-h-[100dvh] max-w-2xl px-5 py-6 sm:px-6 sm:py-10"
      lang={lang}
    >
      <header className="mb-6">
        <p className="text-xs font-medium tracking-[0.15em] text-(--color-brand) uppercase">
          {t.eyebrow}
        </p>
      </header>

      {/* Identity card */}
      <section className="mb-6 flex items-center gap-4 rounded-xl border border-dc-edge bg-dc-surface p-5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-(--color-brand)/10 text-(--color-brand)">
          <UserIcon className="size-6" strokeWidth={2} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-semibold text-dc-text">
            {name ?? email ?? "Worker"}
          </span>
          {email && name ? (
            <span className="block truncate text-xs text-dc-text-2">
              {email}
            </span>
          ) : null}
        </span>
      </section>

      {/* Language */}
      <section aria-labelledby="lang-heading" className="mb-6">
        <h2
          id="lang-heading"
          className="mb-3 text-sm font-semibold tracking-wide text-dc-text-2 uppercase"
        >
          {t.languageHeading}
        </h2>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-dc-edge bg-dc-surface p-4">
          <p className="text-sm text-dc-text-2">{t.languageHint}</p>
          <LanguageToggleClient current={lang} />
        </div>
      </section>

      {/* Account */}
      <section aria-labelledby="account-heading" className="flex flex-col gap-5">
        <h2
          id="account-heading"
          className="text-sm font-semibold tracking-wide text-dc-text-2 uppercase"
        >
          {t.accountHeading}
        </h2>

        {/* Email */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-[0.1em] text-dc-text-3 uppercase">
            {t.emailHeading}
          </p>
          <EmailSectionClient lang={lang} />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-[0.1em] text-dc-text-3 uppercase">
            {t.passwordHeading}
          </p>
          <p className="text-xs text-dc-text-3">{t.passwordHint}</p>
          <PasswordSectionClient lang={lang} hasEmail={hasEmail} />
        </div>

        {/* Sign out */}
        <SignOutClient label={t.signOut} />
      </section>
    </main>
  );
}
