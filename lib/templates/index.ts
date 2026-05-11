import type { SopTemplate } from "@/lib/types/sop";

export type TemplateCategory = "Operations" | "Safety";

export interface SopStarterTemplate {
  id: string;
  title: string;
  description: string;
  style: Exclude<SopTemplate, "onboarding">;
  category: TemplateCategory;
  filename: string;
}

export const SOP_STARTER_TEMPLATES: SopStarterTemplate[] = [
  {
    id: "startup-shutdown",
    title: "Machine Startup & Shutdown Procedure",
    description:
      "Pre-startup safety checks, numbered startup steps, normal operation notes, shutdown sequence, and emergency stop instructions.",
    style: "step-by-step",
    category: "Operations",
    filename: "sop-startup-shutdown.docx",
  },
  {
    id: "forklift-inspection",
    title: "Forklift Pre-Shift Inspection",
    description:
      "Visual and operational checklist an operator completes before every shift. Includes out-of-service tagging instructions.",
    style: "step-by-step",
    category: "Safety",
    filename: "sop-forklift-inspection.docx",
  },
  {
    id: "emergency-contacts",
    title: "Emergency Contacts & Procedures",
    description:
      "Emergency numbers, internal contacts by role, evacuation routes, assembly points, and post-incident steps.",
    style: "reference",
    category: "Safety",
    filename: "sop-emergency-contacts.docx",
  },
  {
    id: "equipment-specs",
    title: "Equipment Specifications Reference",
    description:
      "Equipment inventory, operating parameters, preventive maintenance schedule, and replacement parts tables.",
    style: "reference",
    category: "Operations",
    filename: "sop-equipment-specs.docx",
  },
  {
    id: "daily-safety-inspection",
    title: "Daily Safety Inspection Checklist",
    description:
      "Shift-start checklist covering exits, fire equipment, work area, machinery guards, and PPE availability.",
    style: "safety-checklist",
    category: "Safety",
    filename: "sop-daily-safety-inspection.docx",
  },
  {
    id: "ppe-requirements",
    title: "PPE Requirements by Task",
    description:
      "Task-by-task PPE matrix with inspection procedure, replacement triggers, and where to obtain equipment.",
    style: "safety-checklist",
    category: "Safety",
    filename: "sop-ppe-requirements.docx",
  },
];

export const STYLE_LABELS: Record<Exclude<SopTemplate, "onboarding">, string> = {
  "step-by-step": "Step by Step",
  "reference": "Reference",
  "safety-checklist": "Checklist",
};
