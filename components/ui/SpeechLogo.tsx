// v1.0.0
// Reusable Speech logo badge. Renders the Lucide Speech icon as inline SVG
// inside a rounded teal square. The two arc paths animate with a staggered
// opacity wave; animation is suppressed via CSS when prefers-reduced-motion
// is active (keyframes live in globals.css).

type Size = 'sm' | 'md' | 'lg';
type Variant = 'light' | 'dark';

interface SpeechLogoProps {
  size?: Size;
  variant?: Variant;
  className?: string;
}

const SIZE_MAP: Record<Size, { badge: number; icon: number; radius: number }> = {
  sm: { badge: 28, icon: 16, radius: 6 },
  md: { badge: 36, icon: 20, radius: 8 },
  lg: { badge: 48, icon: 28, radius: 10 },
};

export function SpeechLogo({ size = 'md', variant: _variant = 'light', className }: SpeechLogoProps) {
  const { badge, icon, radius } = SIZE_MAP[size];
  const offset = (badge - icon) / 2;

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
      {/* Teal rounded-square badge -- consistent across light and dark themes */}
      <rect width={badge} height={badge} rx={radius} fill="#14B8A6" />

      {/* Speech icon scaled into the badge centre */}
      <svg
        x={offset}
        y={offset}
        width={icon}
        height={icon}
        viewBox="0 0 24 24"
        fill="none"
        overflow="visible"
      >
        {/* Body / figure path -- solid fill so the head reads clearly on the badge */}
        <path
          d="M8.8 20v-4.1l1.9.2a2.3 2.3 0 0 0 2.164-2.1V8.3A5.37 5.37 0 0 0 2 8.25c0 2.8.656 3.054 1 4.55a5.77 5.77 0 0 1 .029 2.758L2 20"
          fill="white"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Inner arc -- animates first (no delay) */}
        <path
          d="M17 15a3.5 3.5 0 0 0-.025-4.975"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-speech-arc-inner"
        />

        {/* Outer arc -- animates second (0.25s stagger) */}
        <path
          d="M19.8 17.8a7.5 7.5 0 0 0 .003-10.603"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-speech-arc-outer"
        />
      </svg>
    </svg>
  );
}
