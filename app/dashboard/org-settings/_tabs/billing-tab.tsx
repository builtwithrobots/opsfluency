import { CreditCard, Zap } from "lucide-react";

import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getCompanyContext } from "@/lib/auth/company-context";

export async function BillingTab() {
  const { supabase, company_id } = await getCompanyContext("admin");
  const { data: company } = await supabase
    .from("companies")
    .select("name, created_at")
    .eq("id", company_id)
    .single();

  const createdAt = company?.created_at
    ? new Date(company.created_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <section className="flex flex-col gap-8 max-w-2xl">
      <div>
        <Heading level={2} className="font-display text-xl">
          Subscription
        </Heading>
        <Text className="mt-1 text-sm">
          Manage your OpsFluency plan and billing details.
        </Text>
      </div>

      {/* Current plan card */}
      <div className="rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
        <div className="flex items-center justify-between gap-4 border-b border-[color:var(--dc-edge)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full border border-(--color-brand)/30 bg-(--color-brand)/10">
              <Zap className="size-4 text-(--color-brand)" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-semibold text-dc-text">OpsFluency MVP</p>
              <p className="text-xs text-dc-text-3">Early access plan</p>
            </div>
          </div>
          <span className="rounded border border-(--color-signal-ok)/30 bg-(--color-signal-ok)/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-(--color-signal-ok) uppercase">
            Active
          </span>
        </div>

        <dl className="divide-y divide-[color:var(--dc-edge)]">
          <div className="flex items-center justify-between px-5 py-3">
            <dt className="text-xs font-medium text-dc-text-3">Account</dt>
            <dd className="text-sm text-dc-text">{company?.name ?? "—"}</dd>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <dt className="text-xs font-medium text-dc-text-3">Member since</dt>
            <dd className="text-sm text-dc-text">{createdAt ?? "—"}</dd>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <dt className="text-xs font-medium text-dc-text-3">Billing</dt>
            <dd className="text-sm text-dc-text-2">Managed by OpsFluency team</dd>
          </div>
        </dl>
      </div>

      {/* Coming soon */}
      <div className="rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-6 py-8">
        <div className="flex items-start gap-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--dc-edge)] bg-dc-raised">
            <CreditCard className="size-4 text-dc-text-3" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-semibold text-dc-text">
              Self-serve billing coming soon
            </p>
            <p className="mt-1 text-xs text-dc-text-3 max-w-md">
              Upgrade plans, update payment methods, and download invoices will
              be available here once Paddle / Stripe integration ships. Contact
              your OpsFluency account manager for billing changes in the
              meantime.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
