import { Building2, CheckCircle2, Trash2 } from "lucide-react";

import {
  removeLogo,
  updateCompanyProfile,
} from "@/app/dashboard/org-settings/_actions/general";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getCompanyContext } from "@/lib/auth/company-context";

interface Props {
  saved?: boolean;
}

export async function GeneralTab({ saved }: Props) {
  const { supabase, company_id } = await getCompanyContext("admin");
  const { data: company, error } = await supabase
    .from("companies")
    .select("name, phone, logo_url")
    .eq("id", company_id)
    .single();
  if (error) throw error;

  const hasLogo = Boolean(company.logo_url);

  return (
    <section className="flex flex-col gap-6 max-w-2xl">
      {saved ? (
        <div className="flex items-center gap-2 rounded-lg border border-(--color-signal-ok)/30 bg-(--color-signal-ok)/10 px-4 py-3 text-sm font-medium text-(--color-signal-ok)">
          <CheckCircle2 className="size-4 shrink-0" strokeWidth={2} />
          Changes saved successfully.
        </div>
      ) : null}

      <div>
        <Heading level={2} className="font-display text-xl">
          Company profile
        </Heading>
        <Text className="mt-1 text-sm">
          This information appears on QR print headers and across the manager
          dashboard.
        </Text>
      </div>

      {/* Logo card — separate from the save form so Remove is an independent action */}
      <div className="overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <span className="text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase">
            Logo
          </span>
          {hasLogo ? (
            <span className="rounded border border-(--color-signal-ok)/30 bg-(--color-signal-ok)/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-(--color-signal-ok) uppercase">
              Set
            </span>
          ) : (
            <span className="rounded border border-[color:var(--dc-edge)] bg-dc-raised px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-dc-text-3 uppercase">
              Not set
            </span>
          )}
        </div>

        <div className="border-t border-[color:var(--dc-edge)] px-5 py-4">
          {hasLogo ? (
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={company.logo_url!}
                alt="Company logo"
                className="h-16 w-16 rounded-lg border border-[color:var(--dc-edge)] object-contain bg-white p-1.5"
              />
              <div>
                <p className="text-sm font-medium text-dc-text">
                  Logo uploaded
                </p>
                <p className="mt-0.5 text-xs text-dc-text-3">
                  To replace it, pick a new file below and click Save changes.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-[color:var(--dc-edge)] bg-dc-raised">
                <Building2 className="size-6 text-dc-text-3" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-dc-text-2">
                No logo yet. Pick a file below and click Save changes to upload
                one.
              </p>
            </div>
          )}
        </div>

        {hasLogo ? (
          <div className="border-t border-[color:var(--dc-edge)] px-5 py-3">
            <form action={removeLogo}>
              <button
                type="submit"
                className="flex items-center gap-1.5 text-xs font-medium text-(--color-signal-urgent) hover:underline"
              >
                <Trash2 className="size-3.5" strokeWidth={2} />
                Remove logo
              </button>
            </form>
          </div>
        ) : null}
      </div>

      {/* Profile save form — name, phone, and optional logo upload */}
      <form action={updateCompanyProfile} className="flex flex-col gap-5">
        {/* Company name */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase">
            Company name
            <span className="ml-1 text-(--color-signal-urgent)">*</span>
          </span>
          <input
            name="name"
            type="text"
            required
            defaultValue={company.name}
            maxLength={200}
            className="rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
          />
        </label>

        {/* Phone */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase">
            Phone
          </span>
          <input
            name="phone"
            type="tel"
            defaultValue={company.phone ?? ""}
            maxLength={50}
            placeholder="e.g. (555) 123-4567"
            className="rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
          />
        </label>

        {/* Logo upload / replace */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase">
            {hasLogo ? "Replace logo" : "Upload logo"}
          </span>
          <input
            name="logo"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="text-sm text-dc-text-2 file:mr-3 file:rounded-md file:border file:border-[color:var(--dc-edge)] file:bg-dc-raised file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-dc-text-2 hover:file:bg-dc-overlay"
          />
          <p className="text-xs text-dc-text-3">PNG, JPEG, WebP, or SVG.</p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="rounded-md border border-(--color-brand)/30 bg-(--color-brand)/10 px-4 py-2 text-xs font-semibold tracking-wide text-(--color-brand) uppercase hover:bg-(--color-brand)/20"
          >
            Save changes
          </button>
        </div>
      </form>
    </section>
  );
}
