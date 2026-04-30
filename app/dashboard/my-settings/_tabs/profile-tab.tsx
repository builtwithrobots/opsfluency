import { currentUser } from "@clerk/nextjs/server";
import { UserRound } from "lucide-react";

import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getCompanyContext } from "@/lib/auth/company-context";

const labelClass =
  "text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase";

const valueClass = "text-sm text-dc-text";

const ROLE_LABEL: Record<"admin" | "manager" | "employee", string> = {
  admin: "Admin",
  manager: "Manager",
  employee: "Employee",
};

export async function ProfileTab() {
  const { supabase, company_id, role } = await getCompanyContext();
  const user = await currentUser();

  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", company_id)
    .single();

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null;
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const imageUrl = user?.imageUrl ?? null;

  return (
    <section className="flex max-w-3xl flex-col gap-6">
      <div className="overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
        <div className="border-b border-[color:var(--dc-edge)] px-5 py-4">
          <Heading level={2} className="text-xl">
            Account
          </Heading>
          <Text className="mt-1 text-sm">
            Your name, email, and profile photo are managed in your account
            portal.
          </Text>
        </div>

        <div className="flex items-center gap-4 border-b border-[color:var(--dc-edge)] px-5 py-5">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={displayName ?? email ?? "You"}
              className="size-14 shrink-0 rounded-full border border-[color:var(--dc-edge)] object-cover"
            />
          ) : (
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full border border-[color:var(--dc-edge)] bg-dc-raised">
              <UserRound className="size-6 text-dc-text-3" strokeWidth={1.5} />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-dc-text">
              {displayName ?? email ?? "You"}
            </p>
            {email && displayName ? (
              <p className="truncate text-sm text-dc-text-2">{email}</p>
            ) : null}
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <dt className={labelClass}>Full name</dt>
            <dd className={valueClass}>{displayName ?? "—"}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className={labelClass}>Email</dt>
            <dd className={`${valueClass} truncate`}>{email ?? "—"}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className={labelClass}>Role</dt>
            <dd className={valueClass}>{ROLE_LABEL[role] ?? role}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className={labelClass}>Company</dt>
            <dd className={`${valueClass} truncate`}>
              {company?.name ?? "—"}
            </dd>
          </div>
        </dl>

        <div className="border-t border-[color:var(--dc-edge)] px-5 py-3">
          <Text className="text-xs">
            To change your name, email, or profile photo, click your avatar in
            the top-right of the dashboard and choose “Manage account”.
          </Text>
        </div>
      </div>
    </section>
  );
}
