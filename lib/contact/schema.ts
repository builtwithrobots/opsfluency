// v1.0.0
// Shared Zod schema for the contact form. Imported by the client
// component for per-field onBlur validation and by the API route for
// server-side validation. Single source of truth.

import { z } from "zod";

export const EMPLOYEE_COUNTS = [
  "1-50",
  "51-150",
  "151-500",
  "500+",
] as const;

export const ContactFormSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100),
  email: z
    .string()
    .min(1, "Work email is required.")
    .email("Enter a valid email address."),
  company: z.string().min(1, "Company name is required.").max(100),
  employees: z.enum(EMPLOYEE_COUNTS, {
    message: "Select an employee range.",
  }),
  message: z
    .string()
    .min(10, "Tell us a bit more (at least 10 characters).")
    .max(2000, "Keep it under 2000 characters."),
  main_problem: z.string().max(2000).optional(),
});

export type ContactFormInput = z.infer<typeof ContactFormSchema>;

export type ContactFormErrors = Partial<
  Record<keyof ContactFormInput, string>
>;
