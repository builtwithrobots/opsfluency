import { redirect } from "next/navigation";

// Legacy route. The tenant browser now lives as the first tab on
// /dashboard/platform. This redirect preserves any deep links already
// handed out (sales demos, email signatures, docs) without scattering
// the same content across two URLs.
export default function LegacyTenantsRedirect() {
  redirect("/dashboard/platform?tab=tenants");
}
