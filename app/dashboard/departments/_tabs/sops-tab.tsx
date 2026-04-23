import { FileText } from "lucide-react";

export function SopsTab() {
  return (
    <section className="max-w-3xl">
      <div className="rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-8 py-12">
        <div className="flex items-start gap-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--dc-edge)] bg-dc-raised">
            <FileText className="size-5 text-dc-text-3" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-base font-semibold text-dc-text">
              SOPs by Department
            </p>
            <p className="mt-2 text-sm text-dc-text-3 max-w-md">
              The SOP pipeline is under construction. Department-scoped SOP
              assignment will appear here once SOPs ship.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
