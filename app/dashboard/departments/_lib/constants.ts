import {
  Award,
  BookOpen,
  Boxes,
  Briefcase,
  Building2,
  ChefHat,
  ClipboardCheck,
  ClipboardList,
  Cpu,
  Database,
  Factory,
  FlaskConical,
  GraduationCap,
  Hammer,
  HardHat,
  Headphones,
  HeartPulse,
  Leaf,
  Mail,
  Package,
  Phone,
  Printer,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  Users,
  Warehouse,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

// Preset hex colours shown as quick-pick swatches in the colour picker.
// Ordering is intentional: warm → cool → neutral.
export const PRESET_COLORS: { label: string; hex: string }[] = [
  { label: "Red",     hex: "#ef4444" },
  { label: "Orange",  hex: "#f97316" },
  { label: "Amber",   hex: "#f59e0b" },
  { label: "Yellow",  hex: "#facc15" },
  { label: "Green",   hex: "#22c55e" },
  { label: "Emerald", hex: "#10b981" },
  { label: "Teal",    hex: "#14b8a6" },
  { label: "Cyan",    hex: "#06b6d4" },
  { label: "Sky",     hex: "#0ea5e9" },
  { label: "Blue",    hex: "#3b82f6" },
  { label: "Indigo",  hex: "#6366f1" },
  { label: "Violet",  hex: "#8b5cf6" },
  { label: "Purple",  hex: "#a855f7" },
  { label: "Pink",    hex: "#ec4899" },
  { label: "Rose",    hex: "#f43f5e" },
  { label: "Gray",    hex: "#a1a1aa" },
  { label: "Slate",   hex: "#64748b" },
  { label: "Stone",   hex: "#78716c" },
];

export const DEPT_ICONS: Record<string, { label: string; Icon: LucideIcon }> = {
  // Safety & compliance
  "shield-check":   { label: "Shield",        Icon: ShieldCheck   },
  "hard-hat":       { label: "Hard Hat",       Icon: HardHat       },
  "heart-pulse":    { label: "Health",         Icon: HeartPulse    },
  "clipboard-check":{ label: "Compliance",     Icon: ClipboardCheck},
  "leaf":           { label: "Environment",    Icon: Leaf          },

  // Operations & warehouse
  "warehouse":      { label: "Warehouse",      Icon: Warehouse     },
  "factory":        { label: "Factory",        Icon: Factory       },
  "truck":          { label: "Truck",          Icon: Truck         },
  "package":        { label: "Package",        Icon: Package       },
  "boxes":          { label: "Boxes",          Icon: Boxes         },
  "shopping-cart":  { label: "Procurement",    Icon: ShoppingCart  },
  "zap":            { label: "Zap",            Icon: Zap           },

  // Maintenance & engineering
  "wrench":         { label: "Wrench",         Icon: Wrench        },
  "hammer":         { label: "Hammer",         Icon: Hammer        },
  "settings":       { label: "Settings",       Icon: Settings      },
  "flask-conical":  { label: "Lab / QA",       Icon: FlaskConical  },
  "cpu":            { label: "Technology",     Icon: Cpu           },

  // Office & admin
  "briefcase":      { label: "Admin",          Icon: Briefcase     },
  "building-2":     { label: "Office",         Icon: Building2     },
  "clipboard-list": { label: "Checklist",      Icon: ClipboardList },
  "database":       { label: "Data",           Icon: Database      },
  "printer":        { label: "Printing",       Icon: Printer       },
  "mail":           { label: "Mail",           Icon: Mail          },
  "phone":          { label: "Phone",          Icon: Phone         },
  "headphones":     { label: "Support",        Icon: Headphones    },

  // People & training
  "users":          { label: "Team",           Icon: Users         },
  "graduation-cap": { label: "Training",       Icon: GraduationCap },
  "book-open":      { label: "Learning",       Icon: BookOpen      },
  "award":          { label: "Recognition",    Icon: Award         },
  "star":           { label: "Star",           Icon: Star          },

  // Hospitality / food service
  "chef-hat":       { label: "Kitchen",        Icon: ChefHat       },
};

export type IconKey = keyof typeof DEPT_ICONS;

export const ICON_KEYS = Object.keys(DEPT_ICONS) as IconKey[];

// Legacy — kept for components that still reference DEPT_COLORS during transition
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
export const PALETTE_KEYS = Object.keys(DEPT_COLORS) as ColorKey[];
