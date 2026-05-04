// v1.0.0
// BeaconLogo -- teal rounded-square badge containing the Lucide Podcast icon
// rendered as inline SVG. Inner arc pulses first, outer arc follows 0.4s later
// (ripple spreading outward). Animation disabled via CSS under
// prefers-reduced-motion; keyframes live in globals.css.
//
// Paths are hardcoded (no lucide-react import) so CSS class animations
// on individual path elements work reliably.

type Size = 'sm' | 'md' | 'lg';
type Variant = 'light' | 'dark';

interface BeaconLogoProps {
  size?: Size;
  variant?: Variant;
  className?: string;
}

// Icon fills ~85% of badge; centered both axes (Podcast icon is symmetric).
const SIZE_MAP: Record<Size, { badge: number; radius: number }> = {
  sm: { badge: 32, radius: 7  },
  md: { badge: 44, radius: 9  },
  lg: { badge: 58, radius: 12 },
};

export function BeaconLogo({ size = 'md', className }: BeaconLogoProps) {
  const { badge, radius } = SIZE_MAP[size];

  // Scale the 24x24 Lucide viewBox to fill 85% of the badge, centred.
  const iconPx  = badge * 0.85;
  const offset  = (badge - iconPx) / 2;
  const scale   = iconPx / 24;

  return (
    <svg
      width={badge}
      height={badge}
      viewBox={`0 0 ${badge} ${badge}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {/* Teal badge -- same colour in light and dark site themes */}
      <rect width={badge} height={badge} rx={radius} fill="#14B8A6" />

      {/* Podcast icon centred in badge -- paths from Lucide 0.469 */}
      <g transform={`translate(${offset}, ${offset}) scale(${scale})`} color="white">

        {/* Outer arc -- animates second (0.4s stagger after inner) */}
        <path
          d="M16.85 18.58a9 9 0 1 0-9.7 0"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-beacon-arc-outer"
        />

        {/* Inner arc -- animates first (no delay) */}
        <path
          d="M8 14a5 5 0 1 1 8 0"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-beacon-arc-inner"
        />

        {/* Head/dot -- stroke added to match Lucide root stroke-width, making it prominent */}
        <circle
          cx="12" cy="11" r="1"
          fill="currentColor"
          stroke="white"
          strokeWidth="2.2"
        />

        {/* Body/teardrop -- stroke added for same reason */}
        <path
          d="M13 17a1 1 0 1 0-2 0l.5 4.5a0.5 0.5 0 0 0 1 0z"
          fill="currentColor"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
