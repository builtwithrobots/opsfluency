"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { SOP_STARTER_TEMPLATES, type SopStarterTemplate } from "@/lib/templates/index";
import { TemplateCard } from "./TemplateCard";
import { TemplateControls } from "./TemplateControls";

type StyleFilter = SopStarterTemplate["style"] | "all";

function normaliseStyle(raw: string | null): StyleFilter {
  if (raw === "step-by-step" || raw === "reference" || raw === "safety-checklist") return raw;
  return "all";
}

export function TemplateGrid() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const initialStyle = normaliseStyle(searchParams.get("style"));
  const [style, setStyle] = useState<StyleFilter>(initialStyle);
  const [q, setQ] = useState("");

  function handleStyleChange(next: StyleFilter) {
    setStyle(next);
    setQ(""); // reset search when switching tabs
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") {
      params.delete("style");
    } else {
      params.set("style", next);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const filtered = useMemo(() => {
    let list = SOP_STARTER_TEMPLATES;
    if (style !== "all") {
      list = list.filter((t) => t.style === style);
    }
    if (q.trim()) {
      const lower = q.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(lower) ||
          t.description.toLowerCase().includes(lower) ||
          t.category.toLowerCase().includes(lower)
      );
    }
    return list;
  }, [style, q]);

  return (
    <div className="flex flex-col gap-5">
      <TemplateControls
        style={style}
        q={q}
        onStyleChange={handleStyleChange}
        onQChange={setQ}
      />

      {filtered.length > 0 ? (
        <ul
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-label="SOP templates"
        >
          {filtered.map((t) => (
            <li key={t.id}>
              <TemplateCard template={t} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-12 text-center text-sm text-dc-text-3">
          No templates match your search.
        </p>
      )}
    </div>
  );
}
