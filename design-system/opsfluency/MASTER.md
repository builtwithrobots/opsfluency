<!-- v1.0.0 -->
# OpsFluency Design System — Master

> **Authority order (read this first).**
> 1. `app/globals.css` is law. Every color, font, spacing rule, status signal, keyframe, and animation declared there is locked. Nothing in this document overrides it.
> 2. This Master file documents and extends the tokens from `globals.css`. It never contradicts them.
> 3. `design-system/opsfluency/pages/<page>.md` documents per-page deviations from this file. When building a page, read the page override first.
> 4. The `ui-ux-pro-max` skill is a reasoning engine for patterns, layout, interaction, and accessibility. Its color and typography recommendations are advisory only and defer to `globals.css`.

---

**Project:** OpsFluency
**Design language:** Steel & Signal (industrial precision meets frontline fluency)
**Category:** Operations infrastructure for multilingual warehouse and manufacturing facilities
**Voice:** Operational, trustworthy, premium. Control room meets modern SaaS. Not playful, not consumer, not gradient soup.

---

## 1. Color System

### 1.1 Brand (static across light and dark)

| Token | Hex | Role |
|---|---|---|
| `--color-brand` | `#14B8A6` | Teal anchor. Primary CTAs, active links, focus rings, eyebrow accents. |
| `--color-brand-hover` | `#0D9488` | Hover state for brand surfaces. |
| `--color-brand-dim` | `#0F766E` | Pressed state, deep-teal accents on light backgrounds. |
| `--color-brand-50` | `#F0FDFA` | Tint wash for subtle teal backgrounds. Light mode only. |

Tailwind utilities: `bg-[var(--color-brand)]`, `text-[var(--color-brand)]`, `border-[var(--color-brand)]`, or the short forms `bg-brand` / `text-brand` when present as `@theme` tokens.

### 1.2 Status signals (static across light and dark)

Used for live dots, status pills, chart legends, alert strips. High contrast, meaning-bearing. Never reused as decorative color.

| Token | Hex | Meaning |
|---|---|---|
| `--color-signal-live` | `#06B6D4` | Cyan. Active / in-progress / currently-serving. |
| `--color-signal-ok` (alias `--color-signal-good`) | `#10B981` | Emerald. Complete / success. |
| `--color-signal-warn` | `#F59E0B` | Amber. Waiting / needs attention. |
| `--color-signal-urgent` (alias `--color-signal-bad`) | `#EF4444` | Red. Error / overdue. |
| `--color-signal-info` | `#3B82F6` | Blue. Scheduled / informational. |
| `--color-signal-neutral` | `#6B7280` | Gray. Inactive / cancelled. |
| `--color-signal-hub` | `#A855F7` | Purple. Intelligence hubs (reserved for Phase 2). |

### 1.3 Surfaces, text, and edges (theme-adaptive)

These tokens auto-swap when `.dark` is present on `<html>`. Components use them directly (no `dark:` prefix needed for surface work).

| Token | Light | Dark | Role |
|---|---|---|---|
| `--color-dc-bg` | `#F0F2F5` | `#0C0E14` | Page background. |
| `--color-dc-surface` | `#FFFFFF` | `#141720` | Cards, panels, form fields, resting surface. |
| `--color-dc-raised` | `#F9FAFB` | `#1C2030` | Hover state for surface, sub-panels. |
| `--color-dc-overlay` | `#F3F4F6` | `#232840` | Tooltips, dropdowns, monitor overlays. |
| `--color-dc-text` | `#0F1117` | `#F0F4FC` | Primary body text, headlines. |
| `--color-dc-text-2` | `#4B5563` | `#8B9ABF` | Secondary text, descriptions, labels. |
| `--color-dc-text-3` | `#9CA3AF` | `#4A5068` | Muted / placeholder / timestamps. |
| `--color-dc-edge` | `#E5E7EB` | `#252A3A` | Default divider, card border. |
| `--color-dc-edge-2` | `#D1D5DB` | `#363D54` | Emphasis divider, input border. |

Tailwind shortcuts registered in `@theme`: `bg-dc-bg`, `bg-dc-surface`, `bg-dc-raised`, `bg-dc-overlay`, `text-dc-text`, `text-dc-text-2`, `text-dc-text-3`, `border-dc-edge`, `border-dc-edge-2`.

### 1.4 Legacy tokens (do not use in marketing)

`--color-primary-*` and `--color-success-*` exist for Clerk's appearance API only. Never reference them in marketing or product components.

---

## 2. Typography

Fonts are loaded by `next/font/google` in `app/layout.tsx` and exposed as CSS variables. Use the variables, not direct `font-family` strings.

| Font | Variable | Tailwind | Role |
|---|---|---|---|
| Chakra Petch | `--font-display` | `font-display` | `h1`–`h3`, eyebrow labels (`uppercase tracking-widest`), numeric stats, logo, pricing numbers, step numerals, hero CTAs where brand voice is loud. Weights available: 400 / 500 / 600 / 700. |
| Inter | `--font-sans` | `font-sans` (default) | `h4`–`h6`, body copy, UI labels, form fields, helper text, nav links, button text in most cases. |
| JetBrains Mono | `--font-mono` | `font-mono` | Code, identifiers, timestamps, SOP ids, version strings, status-pill values. |

**Base sizes.** Body 16px, line-height 1.5. Never go below 14px for anything a user reads. Eyebrow labels 12px uppercase with `tracking-widest` (approx 0.15em).

**Scale (desktop defaults, clamp to 80 percent on mobile unless noted):**

| Role | Class | Font |
|---|---|---|
| Hero h1 | `text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight` | display |
| Section h2 | `text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight` | display |
| Sub-section h3 | `text-2xl md:text-3xl font-semibold` | display |
| Card heading h4 | `text-xl font-semibold` | sans |
| Body | `text-base leading-relaxed text-dc-text-2` | sans |
| Lead paragraph | `text-lg md:text-xl leading-relaxed text-dc-text-2` | sans |
| Eyebrow | `text-xs uppercase tracking-widest font-semibold text-brand` | display |
| Stat numeral | `text-5xl md:text-6xl font-bold tabular-nums` | display |
| Mono inline | `font-mono text-sm` | mono |

**Pull-quote rule.** When a page uses a pull quote (About, Home founder block), it's Chakra Petch, weight 500, italic off, size `text-2xl md:text-3xl`, color `text-dc-text`, with a 2px left border in `--color-brand`.

---

## 3. Spacing

4 / 8 grid. Tailwind scale maps directly to it (`p-1` = 4px, `p-2` = 8px, `p-4` = 16px). No arbitrary pixel values in components unless there is a written reason.

| Token | Tailwind | Role |
|---|---|---|
| xs | `1` | Tight icon / text gaps. |
| sm | `2` | Inline gaps, pill interior. |
| md | `4` | Standard card interior, form field padding. |
| lg | `6` | Card interior on large cards, form row gaps. |
| xl | `8` | Group separators, sidebar interiors. |
| 2xl | `12` | Component-to-component gaps inside a section. |
| 3xl | `16` | Section header to section body. |
| section | `py-16 md:py-24` | Vertical rhythm between marketing sections. |
| section-loose | `py-20 md:py-32` | Hero, final CTA, major transitions. |

**Container widths** (see `components/ui/Container.tsx`, built in Phase 2.3):

- default: `max-w-7xl` (1280px) — most marketing sections
- narrow: `max-w-4xl` (896px) — long-form prose (About, FAQ bodies)
- wide: `max-w-screen-2xl` (1536px) — full-bleed hero decorations

Horizontal gutters: `px-6 sm:px-8 lg:px-12`. Never less than 24px on mobile.

---

## 4. Elevation

Light mode uses subtle shadows; dark mode uses edge outlines instead (shadows on dark surfaces read as grime). Every component must pick a level from this scale.

| Level | Light mode | Dark mode | Role |
|---|---|---|---|
| 0 | none | none | Flat, in-flow. Default. |
| 1 | `shadow-[0_1px_2px_rgba(15,17,23,0.04)]` + `border border-dc-edge` | `border border-dc-edge` | Resting card / form field. |
| 2 | `shadow-[0_4px_12px_rgba(15,17,23,0.06)]` + `border border-dc-edge` | `border border-dc-edge-2` | Hovered card, featured card. |
| 3 | `shadow-[0_12px_32px_rgba(15,17,23,0.10)]` + `border border-dc-edge` | `border border-dc-edge-2` + `bg-dc-raised` | Sticky nav on scroll, active mobile sheet. |
| 4 | `shadow-[0_24px_48px_rgba(15,17,23,0.14)]` | `bg-dc-overlay border border-dc-edge-2` | Modals, opened pricing compare table mobile. |

**Brand glow.** For the "Most popular" pricing tier and any emphasis card, layer the existing `.animate-brand-glow` utility on top of level 1. It is pre-defined in `globals.css` as a gentle 3s pulse.

---

## 5. Motion System

Motion has two lanes. Keep them separate. Do not re-implement one in the other.

### 5.1 Ambient motion (CSS keyframes, already in globals.css)

Always-on or status-triggered animations. Use the utility class directly.

| Utility | Purpose |
|---|---|
| `.animate-heartbeat` | 2s heartbeat. Live pulse dots. |
| `.animate-signal-pulse` | 2s radial ring. Active status pills. |
| `.animate-brand-glow` | 3s teal glow. Emphasis surfaces (featured pricing, hero stat). |
| `.animate-calm-pulse` | 3.2s opacity breathing. Non-critical idle indicators. Honors `prefers-reduced-motion`. |
| `.animate-fade-in` | 180ms one-shot fade. First paint on hydration. |
| `.background` | Static grid background for marketing hero. |
| `[data-state=open]` on accordion content | 200ms slide-down. Used by FAQ via Radix. |

### 5.2 User-triggered motion (Framer Motion)

Reacts to scroll, tap, hover, or state change. Built in `lib/motion/variants.ts` (Phase 2.1) and wrapped in `components/motion/MotionSection.tsx`.

| Pattern | Duration | Easing | Use |
|---|---|---|---|
| Section reveal on scroll (`whileInView`, `once: true`, margin `-10%`) | 400ms | `easeOut` | Every marketing section below the fold. |
| Staggered child reveal | 30–50ms per child | `easeOut` | Feature grids, stat rows, tier cards. |
| Hover lift (card) | 200ms | `easeOut` | `translateY(-2px)` + shadow bump. |
| Tap press | 100ms | linear | `scale(0.98)` on primary buttons. |
| Mobile nav sheet | 280ms in / 220ms out | `easeOut` / `easeIn` | Slide from right + backdrop fade. |
| Pricing toggle | 300ms `layout` animation | Framer default | Prices swap without flicker. |

**Reduced motion.** Every variant uses `useReducedMotion()` from `framer-motion`; when true, durations collapse to `0.01`. The global CSS rule in `globals.css` also neutralizes `animation-duration` and `transition-duration`. Never override this from a component.

**Never animate** `width`, `height`, `top`, `left`, `margin`, `padding`. Only `transform` and `opacity`.

---

## 6. Component Tokens (semantic map)

Every component references `globals.css` via these roles. No raw hex, no one-off colors.

### Button primary
- background: `--color-brand`
- hover background: `--color-brand-hover`
- pressed background: `--color-brand-dim`
- text: `#FFFFFF` (contrast-safe on all three brand shades)
- focus ring: `--color-brand` at `outline-offset: 2px` (inherits from global `:focus-visible`)
- disabled: `opacity-50 cursor-not-allowed`

### Button secondary
- background: transparent
- border: `--color-dc-edge-2`
- text: `--color-dc-text`
- hover background: `--color-dc-raised`
- hover border: `--color-dc-text-3`

### Button ghost
- background: transparent
- text: `--color-dc-text-2`
- hover background: `--color-dc-raised`
- hover text: `--color-dc-text`

### Card
- background: `--color-dc-surface`
- border: `--color-dc-edge`
- radius: `rounded-xl` (12px)
- padding: `p-6 md:p-8`
- hover (when interactive): elevation 2 + `translateY(-2px)`

### Divider
- border: `--color-dc-edge`
- width: 1px
- never use opacity tricks; use the real edge token

### Input
- background: `--color-dc-surface`
- border: `--color-dc-edge-2`
- border-radius: `rounded-md` (6px)
- padding: `px-4 py-2.5`
- font-size: 16px (prevents iOS auto-zoom on tap)
- focus: `outline` ring inherited from global `:focus-visible`

### Eyebrow label
- display font, uppercase, `tracking-widest`, `text-xs font-semibold`
- color: `--color-brand`
- optional leading dot: `.animate-heartbeat` + `bg-signal-live`

### Stat callout
- numeral: display font, `text-5xl md:text-6xl font-bold tabular-nums`
- numeral color: `--color-dc-text`
- label below: sans font, `text-sm text-dc-text-2 uppercase tracking-wide`

### Status pill
- background: corresponding `--color-signal-*` at 12 percent alpha
- text: corresponding `--color-signal-*` at full alpha
- border: 1px solid same color at 25 percent alpha
- font: mono or sans, `text-xs font-semibold`

---

## 7. Page Pattern — Real-Time / Operations Landing

Inherited from the skill; maps cleanly to our product.

- **Conversion strategy.** Demo the product. Surface trust signals (founder credibility, concrete time savings). Two CTAs per page: primary "Start free trial" and secondary "Talk to Rob" or "See how it works".
- **CTA placement.** Primary CTA in nav (top right, persistent). Primary CTA after first metrics block. Primary CTA in the page-bottom `CTABlock`.
- **Section order (landing pages).** Hero with live visual → key metrics → feature / solution trio → how it works teaser → pricing teaser or social proof → final CTA.

---

## 8. Accessibility Floor — WCAG 2.1 AA, no exceptions

- Contrast: 4.5:1 normal text, 3:1 large text (18pt+ or 14pt bold) and UI components. Every combination in sections 1.3 and 6 has been pre-selected to clear this in both modes.
- Touch targets: minimum 44×44px on all interactive elements. Applies to desktop too — icon buttons get padding to reach the target.
- Keyboard: every interactive element reachable by Tab in visual order. `:focus-visible` ring is already global in `globals.css`; do not remove.
- Skip link: `app/layout.tsx` already renders `<a href="#main" class="skip-link">`; every marketing page mounts its main content inside `<main id="main">`.
- Semantic HTML: one `<h1>` per page. Sequential heading levels. `<section>` with `aria-labelledby` for each named section. `<nav aria-label="Primary">` on the marketing nav. `<footer>` landmark on the marketing footer.
- Reduced motion: respected globally by CSS and per-variant by `useReducedMotion()`. Never bypass.
- Icon-only controls: `aria-label`.
- Form fields: visible `<label>`, not placeholder-only. Error message adjacent to the field, referenced via `aria-describedby`. Never rely on color alone.
- Images: meaningful `alt`, decorative `alt=""`, Next.js `<Image>` with explicit `width` and `height` to prevent CLS.
- Language: `<html lang="en">` for marketing. Bilingual rules live in the `opsfluency-accessibility` skill and do not apply to the marketing site (it is English only).

---

## 9. Icons

- Library: Lucide React. Single stroke-width (2). One family everywhere.
- No emoji as icons. Ever.
- Size defaults: `size-4` (16px) inline with text, `size-5` (20px) in buttons, `size-6` (24px) in feature cards, `size-8` (32px) for hero decorative icons.
- Color: inherit via `currentColor`. Set via the parent's text color token.
- **Dependency note.** `package.json` currently pins `lucide-react@^1.8.0`, which is the 2020 fork with a very limited icon catalog. Phase 2 will upgrade to the current `lucide-react@^0.469.x` before any component imports an icon, so we have the modern set (`ArrowRight`, `QrCode`, `Languages`, `ShieldCheck`, `MonitorSmartphone`, etc.). That bump is the only dependency change planned.

---

## 10. Pre-delivery checklist (run before shipping any page)

- [ ] No raw hex values in components. All colors reference tokens.
- [ ] No font family other than Chakra Petch, Inter, or JetBrains Mono.
- [ ] No emoji used as icons.
- [ ] Every section is its own component file under `components/marketing/<page>/`.
- [ ] `4.5:1` contrast verified in both light and dark modes.
- [ ] Every interactive element is keyboard-reachable with visible focus ring.
- [ ] Touch targets ≥ 44×44px.
- [ ] `prefers-reduced-motion` respected on every animation.
- [ ] All `<Image>` elements have explicit width and height.
- [ ] No horizontal scroll at 375 / 768 / 1024 / 1440.
- [ ] Heading hierarchy is sequential (one `<h1>`, then `<h2>` children, etc.).
- [ ] Skip link works: press Tab on page load, first focus is the brand-teal "Skip to main content" pill.
- [ ] Every file header comment starts with `// v1.0.0` (bump on change).
- [ ] No em-dashes in copy or comments. Use colons, parentheses, or rewrite.
