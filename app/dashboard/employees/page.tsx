import { Users } from "lucide-react";

import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export default function EmployeesPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs font-medium tracking-[0.15em] text-(--color-brand) uppercase">
          Manager
        </p>
        <Heading className="font-display mt-2">Employees</Heading>
        <Text className="mt-2 max-w-2xl">
          Invite employees, manage roles, and view employee profiles.
        </Text>
      </header>

      <div className="max-w-3xl rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-8 py-12">
        <div className="flex items-start gap-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--dc-edge)] bg-dc-raised">
            <Users className="size-5 text-dc-text-3" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-base font-semibold text-dc-text">
              Employee management coming soon
            </p>
            <p className="mt-2 text-sm text-dc-text-3 max-w-md">
              Invite employees via magic link, assign them to departments, and
              manage their access. This page will be fully functional in the
              next sprint.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
