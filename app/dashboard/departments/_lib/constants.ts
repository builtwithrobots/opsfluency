import {
  Building2,
  ClipboardList,
  FlaskConical,
  HardHat,
  ShieldCheck,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

// Full Tailwind class strings must be written out in full — never assembled
// via string concatenation — so the JIT purger includes them in the bundle.

export const DEPT_COLORS = {
  sky:     { label: "Sky",     bg: "bg-sky-500",     text: "text-sky-600"     },
  emerald: { label: "Emerald", bg: "bg-emerald-500", text: "text-emerald-600" },
  amber:   { label: "Amber",   bg: "bg-amber-400",   text: "text-amber-600"   },
  violet:  { label: "Violet",  bg: "bg-violet-500",  text: "text-violet-600"  },
  rose:    { label: "Rose",    bg: "bg-rose-500",    text: "text-rose-600"    },
  orange:  { label: "Orange",  bg: "bg-orange-500",  text: "text-orange-600"  },
  teal:    { label: "Teal",    bg: "bg-teal-500",    text: "text-teal-600"    },
  indigo:  { label: "Indigo",  bg: "bg-indigo-500",  text: "text-indigo-600"  },
  yellow:  { label: "Yellow",  bg: "bg-yellow-400",  text: "text-yellow-600"  },
  zinc:    { label: "Gray",    bg: "bg-zinc-400",    text: "text-zinc-500"    },
} as const;

export type ColorKey = keyof typeof DEPT_COLORS;

export const DEPT_ICONS: Record<
  string,
  { label: string; Icon: LucideIcon }
> = {
  "shield-check":   { label: "Shield",    Icon: ShieldCheck   },
  "wrench":         { label: "Wrench",    Icon: Wrench        },
  "users":          { label: "Team",      Icon: Users         },
  "clipboard-list": { label: "Checklist", Icon: ClipboardList },
  "zap":            { label: "Zap",       Icon: Zap           },
  "hard-hat":       { label: "Hard Hat",  Icon: HardHat       },
  "flask-conical":  { label: "Flask",     Icon: FlaskConical  },
  "building-2":     { label: "Building",  Icon: Building2     },
};

export type IconKey = keyof typeof DEPT_ICONS;

export const PALETTE_KEYS = Object.keys(DEPT_COLORS) as ColorKey[];
export const ICON_KEYS = Object.keys(DEPT_ICONS) as IconKey[];
