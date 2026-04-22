'use client';

interface Props {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
}

export default function DotSlider({
  label,
  value,
  min = 40,
  max = 90,
  step = 5,
  onChange,
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-dc-text-2">{label}</span>
        <span className="text-sm tabular-nums text-dc-text-3">{value}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        aria-label={label}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-dc-raised accent-white"
      />
      <div className="flex justify-between">
        {Array.from({ length: (max - min) / step + 1 }, (_, i) => min + i * step).map(v => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            aria-label={`Set ${label} to ${v}%`}
            className={[
              'h-2.5 w-2.5 rounded-full transition-colors',
              v === value ? 'bg-white' : 'bg-dc-edge hover:bg-dc-text-3',
            ].join(' ')}
          />
        ))}
      </div>
    </div>
  );
}
