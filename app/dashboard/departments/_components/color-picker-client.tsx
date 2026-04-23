"use client";

import { useState } from "react";

import { PRESET_COLORS } from "@/app/dashboard/departments/_lib/constants";

interface Props {
  defaultValue?: string;
  name?: string;
}

export function ColorPickerClient({ defaultValue = "#a1a1aa", name = "color_hex" }: Props) {
  const [hex, setHex] = useState(defaultValue);

  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase">
        Color
      </legend>

      {/* Hidden input carries the value when the form is submitted */}
      <input type="hidden" name={name} value={hex} />

      {/* Preset swatches */}
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map(({ label, hex: presetHex }) => (
          <button
            key={presetHex}
            type="button"
            title={label}
            onClick={() => setHex(presetHex)}
            className="size-6 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              backgroundColor: presetHex,
              boxShadow:
                hex === presetHex
                  ? `0 0 0 2px var(--dc-surface), 0 0 0 4px ${presetHex}`
                  : undefined,
            }}
            aria-label={`${label} (${presetHex})`}
            aria-pressed={hex === presetHex}
          />
        ))}
      </div>

      {/* Custom colour wheel */}
      <div className="mt-3 flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2">
          <span className="text-xs text-dc-text-2">Custom</span>
          <input
            type="color"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            className="size-7 cursor-pointer rounded border border-[color:var(--dc-edge)] p-0.5"
            aria-label="Pick a custom colour"
          />
        </label>
        <code className="font-mono text-xs text-dc-text-3">{hex}</code>
        {/* Live preview dot */}
        <span
          className="size-5 rounded-full border border-[color:var(--dc-edge)]"
          style={{ backgroundColor: hex }}
          aria-hidden
        />
      </div>
    </fieldset>
  );
}
