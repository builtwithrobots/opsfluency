'use client';

interface Props {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  /** Suffix shown after the numeric value. Default '%'. */
  unit?: string;
  onChange: (v: number) => void;
}

export default function DotSlider({
  label,
  value,
  min = 40,
  max = 90,
  step = 5,
  unit = '%',
  onChange,
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-dc-text-2">{label}</span>
        <span className="text-sm tabular-nums text-dc-text-3">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        aria-label={label}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-dc-raised accent-(--color-brand)"
      />
    </div>
  );
}
