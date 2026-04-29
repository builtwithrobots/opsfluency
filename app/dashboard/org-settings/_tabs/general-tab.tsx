import { Building2, CheckCircle2, ImagePlus, Trash2 } from "lucide-react";

import {
  removeLogo,
  updateCompanyProfile,
  uploadLogo,
} from "@/app/dashboard/org-settings/_actions/general";
import { Heading } from "@/components/ui/heading";
import { PhoneInput } from "@/components/ui/phone-input";
import { Text } from "@/components/ui/text";
import { getCompanyContext } from "@/lib/auth/company-context";

interface Props {
  saved?: boolean;
}

const inputClass =
  "w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none";

const labelClass =
  "text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase";

export async function GeneralTab({ saved }: Props) {
  const { supabase, company_id } = await getCompanyContext("admin");
  const { data: company, error } = await supabase
    .from("companies")
    .select("name, phone, logo_url, address_line1, address_line2, city, state, zip")
    .eq("id", company_id)
    .single();
  if (error) throw error;

  const hasLogo = Boolean(company.logo_url);

  return (
    <section className="flex flex-col gap-6 max-w-5xl">
      {saved ? (
        <div className="flex items-center gap-2 rounded-lg border border-(--color-signal-ok)/30 bg-(--color-signal-ok)/10 px-4 py-3 text-sm font-medium text-(--color-signal-ok)">
          <CheckCircle2 className="size-4 shrink-0" strokeWidth={2} />
          Changes saved successfully.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      {/* ── Card 1: Company information ─────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
        <div className="border-b border-[color:var(--dc-edge)] px-5 py-4">
          <Heading level={2} className="text-xl">
            Company information
          </Heading>
          <Text className="mt-1 text-sm">
            Appears on QR print headers and will pre-fill the onboarding form
            once that flow is wired up.
          </Text>
        </div>

        <form action={updateCompanyProfile} className="flex flex-col gap-5 px-5 py-5">
          {/* Name */}
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>
              Company name
              <span className="ml-1 text-(--color-signal-urgent)">*</span>
            </span>
            <input
              name="name"
              type="text"
              required
              defaultValue={company.name}
              maxLength={200}
              className={inputClass}
            />
          </label>

          {/* Address line 1 */}
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Address line 1</span>
            <input
              name="address_line1"
              type="text"
              defaultValue={company.address_line1 ?? ""}
              maxLength={200}
              placeholder="123 Warehouse Blvd"
              className={inputClass}
            />
          </label>

          {/* Address line 2 */}
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Address line 2</span>
            <input
              name="address_line2"
              type="text"
              defaultValue={company.address_line2 ?? ""}
              maxLength={200}
              placeholder="Suite 400"
              className={inputClass}
            />
          </label>

          {/* City / State / ZIP */}
          <div className="grid grid-cols-[1fr_5rem_8rem] gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>City</span>
              <input
                name="city"
                type="text"
                defaultValue={company.city ?? ""}
                maxLength={100}
                placeholder="Chicago"
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>State</span>
              <input
                name="state"
                type="text"
                defaultValue={company.state ?? ""}
                maxLength={50}
                placeholder="IL"
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>ZIP</span>
              <input
                name="zip"
                type="text"
                defaultValue={company.zip ?? ""}
                maxLength={20}
                placeholder="60601"
                className={inputClass}
              />
            </label>
          </div>

          {/* Phone */}
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Phone</span>
            <PhoneInput
              name="phone"
              defaultValue={company.phone}
              className={inputClass}
            />
          </label>

          <div className="flex justify-end border-t border-[color:var(--dc-edge)] pt-4">
            <button
              type="submit"
              className="rounded-md border border-(--color-brand)/30 bg-(--color-brand)/10 px-4 py-2 text-xs font-semibold tracking-wide text-(--color-brand) uppercase hover:bg-(--color-brand)/20"
            >
              Save changes
            </button>
          </div>
        </form>
      </div>

      {/* ── Card 2: Logo ──────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
        <div className="flex items-center justify-between gap-4 border-b border-[color:var(--dc-edge)] px-5 py-4">
          <div>
            <Heading level={2} className="text-xl">
              Logo
            </Heading>
            <Text className="mt-0.5 text-sm">
              Shown on QR print headers and the manager dashboard.
            </Text>
          </div>
          {hasLogo ? (
            <span className="shrink-0 rounded border border-(--color-signal-ok)/30 bg-(--color-signal-ok)/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-(--color-signal-ok) uppercase">
              Set
            </span>
          ) : (
            <span className="shrink-0 rounded border border-[color:var(--dc-edge)] bg-dc-raised px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-dc-text-3 uppercase">
              Not set
            </span>
          )}
        </div>

        {/* Current logo preview */}
        <div className="border-b border-[color:var(--dc-edge)] px-5 py-5">
          {hasLogo ? (
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={company.logo_url!}
                alt="Company logo"
                className="h-20 w-20 rounded-lg border border-[color:var(--dc-edge)] bg-white object-contain p-2"
              />
              <p className="text-sm text-dc-text-2">
                Pick a new file below to replace this logo.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-[color:var(--dc-edge)] bg-dc-raised">
                <Building2 className="size-7 text-dc-text-3" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-dc-text-2">No logo uploaded yet.</p>
            </div>
          )}
        </div>

        {/* Upload / replace — own form, not nested */}
        <form
          action={uploadLogo}
          className="flex flex-wrap items-end justify-between gap-4 border-b border-[color:var(--dc-edge)] px-5 py-4"
        >
          <label className="flex flex-1 flex-col gap-1.5">
            <span className={labelClass}>
              {hasLogo ? "Replace logo" : "Upload logo"}
            </span>
            <input
              name="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="text-sm text-dc-text-2 file:mr-3 file:rounded-md file:border file:border-[color:var(--dc-edge)] file:bg-dc-raised file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-dc-text-2 hover:file:bg-dc-overlay"
            />
            <p className="text-xs text-dc-text-3">PNG, JPEG, WebP, or SVG.</p>
          </label>
          <button
            type="submit"
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-(--color-brand)/30 bg-(--color-brand)/10 px-4 py-2 text-xs font-semibold tracking-wide text-(--color-brand) uppercase hover:bg-(--color-brand)/20"
          >
            <ImagePlus className="size-3.5" strokeWidth={2} />
            Save logo
          </button>
        </form>

        {/* Remove — own form, sibling (not nested) of the upload form */}
        {hasLogo ? (
          <form action={removeLogo} className="px-5 py-3">
            <button
              type="submit"
              className="flex items-center gap-1.5 text-xs font-medium text-(--color-signal-urgent) hover:underline"
            >
              <Trash2 className="size-3.5" strokeWidth={2} />
              Remove logo
            </button>
          </form>
        ) : null}
      </div>
      </div>{/* end grid */}
    </section>
  );
}
