"use client";

import { useState } from "react";

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

interface PhoneInputProps {
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

/**
 * Controlled phone input that auto-formats to (XXX) XXX-XXXX as the user
 * types. Strips non-digits on every keystroke so pasting "5551234567" or
 * "555-123-4567" both produce the same result. Safe to drop into any
 * <form> — the `name` prop surfaces the formatted value on submit.
 */
export function PhoneInput({
  name,
  defaultValue,
  placeholder = "(555) 123-4567",
  className,
  required,
}: PhoneInputProps) {
  const [value, setValue] = useState(() => formatPhone(defaultValue ?? ""));

  return (
    <input
      name={name}
      type="tel"
      value={value}
      onChange={(e) => setValue(formatPhone(e.target.value))}
      placeholder={placeholder}
      className={className}
      required={required}
      maxLength={14}
      autoComplete="tel"
    />
  );
}
