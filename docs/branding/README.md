# OpsFluency Branding

> Guiding light for everything the customer sees — marketing site, manager dashboard, worker PWA, monitor displays, QR print layouts, sales decks, emails.
> Last updated: 2026-04-21

This doc is the **intent**. The **implementation** lives in code:

- Design tokens (colors, fonts, surface values): [`app/globals.css`](../../app/globals.css) — single source of truth, do not restate hex values here.
- Voice in product strings: bilingual rules in [`.claude/skills/opsfluency-bilingual-content/SKILL.md`](../../.claude/skills/opsfluency-bilingual-content/SKILL.md).
- Accessibility on top of WCAG 2.1 AA: [`.claude/skills/opsfluency-accessibility/SKILL.md`](../../.claude/skills/opsfluency-accessibility/SKILL.md) and [`CLAUDE.md`](../../CLAUDE.md) → "Accessibility Requirements".

If this doc disagrees with `globals.css` or `CLAUDE.md`, **code wins** — fix the drift here.

---

## 1. Positioning & voice

**One-line pitch:** "Yourco broadcasts messages. OpsFluency enables competence."

**Category:** Frontline knowledge and engagement platform for multilingual warehouse and manufacturing facilities. Not a translation tool. Operations infrastructure.

**Who it's for:** Operations managers at 50–500-worker facilities where the floor is bilingual (English + Spanish) and SOPs live in drawers, binders, and tribal knowledge.

**Who it's not for:** Corporate L&D departments, HR compliance broadcasters, single-language teams, per-seat SaaS buyers.

### Voice

| Dimension | We are | We are not |
|---|---|---|
| Tone | Direct, confident, operations-native | Chirpy, corporate, jargon-laden |
| POV | "Your managers publish. Your workers learn." | "Empower your workforce with AI-driven insights." |
| Posture | Industrial precision, frontline fluency | Startup-optimistic, trend-chasing |
| Vocabulary | SOP, floor, shift, scan, published | "Content," "experiences," "journeys," "wellness" |

**Write like a plant manager talking to another plant manager.** Short sentences. Verbs over adjectives. Numbers when they exist. Never apologize for being about warehouses.

### Manifesto lines (approved for marketing surfaces)

- "Bilingual by default. Because your floor already is."
- "A QR code on the machine. The right SOP in the right language. Zero clicks to competence."
- "The translation runs once. The understanding compounds forever."

---

## 2. Logo & wordmark

Assets in `public/`:

- `dark-logo.png` — use on light backgrounds (marketing pages, print QR headers, emails).
- `light-logo.png` — use on dark backgrounds (monitor displays, dark-mode dashboard chrome).

### Rules

- **Minimum clear space:** one cap-height of "O" on all sides. Never crop, rotate, or outline.
- **Minimum size:** 120px wide on screen, 1in wide in print. Below that, use the wordmark alone.
- **Wordmark typography:** "OpsFluency" set in Chakra Petch 700, `--font-display`. One word, two capitals: **Ops**Fluency. Never "Opsfluency," "OPS FLUENCY," or "ops fluency."
- **Never** re-color the logo. Never set it on a color that fails 3:1 contrast with the mark.

### Favicon

`app/favicon.ico` — keep simple and high-contrast at 16×16. If it doesn't read at tab size, it's wrong.

---

## 3. Color

**Source of truth:** [`app/globals.css`](../../app/globals.css) → `@theme { … }`. Do not hardcode hex values in components — import via Tailwind utilities (`bg-[var(--color-brand)]`, `text-dc-text`, etc.) or CSS custom properties.

### Roles, not shades

| Role | Token | When to use |
|---|---|---|
| Brand anchor | `--color-brand` (teal) | Primary actions, logo accents, focus rings, the QR scan-complete state |
| Live / in-progress | `--color-signal-live` (cyan) | Currently-translating SOPs, live monitor pulse, scan-in-flight |
| Success / complete | `--color-signal-ok` (emerald) | Published SOPs, approved translations, completed onboarding |
| Warning / waiting | `--color-signal-warn` (amber) | `pending_terms`, `pending_translation`, `pending_approval`, `needs_retranslation` flag |
| Error / archived | `--color-signal-urgent` (red) | `archived` SOP, failed translation, QR serves 410 |
| Info / scheduled | `--color-signal-info` (blue) | Announcements, informational callouts |
| Intelligence / AI | `--color-signal-hub` (purple) | Sonnet-generated content markers, glossary-flagged terms |
| Neutral | `--color-signal-neutral` (gray) | Disabled controls, inactive employees |

### Contrast rules (non-negotiable)

- Body text vs background ≥ **4.5:1**
- Large text (18px+) and UI components ≥ **3:1**
- Focus ring (teal on any surface) must clear 3:1 — the `:focus-visible` rule in `globals.css` already enforces this.
- **Never rely on color alone.** Every signal color must be paired with an icon or a text label. A colorblind worker on the floor sees shape first.

### Light vs dark

Both modes are first-class. Dashboard defaults to light (office lighting). Monitor displays are dark by default (warehouse glare). The `dc-*` utility classes adapt automatically — never write `dark:` prefixes on those.

---

## 4. Typography

**Source of truth:** [`app/globals.css`](../../app/globals.css) → `--font-display`, `--font-sans`, `--font-mono`. Fonts are loaded via `next/font/google` in [`app/layout.tsx`](../../app/layout.tsx) — don't add `<link>` tags or CSS `@import url(...)` calls.

| Family | Variable | Use for |
|---|---|---|
| Chakra Petch | `--font-display` | Page titles (h1/h2), wordmark, skip link, monitor display headers, QR print headers — anywhere the industrial voice needs to show up |
| Inter | `--font-sans` | All body text, form labels, table content, announcements, SOP body copy |
| JetBrains Mono | `--font-mono` | QR code IDs, SOP version numbers, glossary term keys, inline code, technical metadata |

### Sizing minimums

- SOP body copy: **minimum 16px** (14px is too small for gloved workers in warehouse lighting)
- Monitor display body: **fixed sizes** — do not scale with screen size. See [`CLAUDE.md`](../../CLAUDE.md) → "Monitor Display" for the exact values when monitors are implemented.
- Interactive text (buttons, links): 16px desktop, 18px on touch surfaces.

### Hierarchy

Three levels, no more. If a page needs four, redesign it.

1. **Page title** — Chakra Petch 700, `text-3xl md:text-4xl tracking-tight`
2. **Section heading** — Chakra Petch 600, `text-xl md:text-2xl`
3. **Body** — Inter 400, `text-base leading-relaxed`

Never use italic for emphasis (Chakra Petch italic reads as a different font). Use weight.

---

## 5. Iconography

**Style:** Single-weight stroke, 1.5–2px, rounded caps. Industrial, not playful.

**Pairing:** Every signal color pairs with a specific icon family — use the same icon across surfaces so workers learn the visual shorthand.

| Signal | Icon family | Example |
|---|---|---|
| Live | `radio` / pulsing dot | Live monitor footer |
| OK | `check-circle` | Published SOP badge |
| Warn | `clock` / `hourglass` | `pending_translation` chip |
| Urgent | `alert-triangle` | Safety warning in SOP body |
| Info | `info` | Announcement header |
| Hub / AI | `sparkles` | Glossary-flagged term highlight |
| Neutral | `minus-circle` | Archived QR destination page |

Target icon library (to be installed in Phase 6): **`lucide-react`** — matches the visual spec, tree-shakable, no icon font needed. Don't mix libraries.

**Minimum tap target:** 44×44px on mobile/PWA, per [`CLAUDE.md`](../../CLAUDE.md) → "Accessibility Requirements". Icon can be smaller; the tap target cannot.

---

## 6. Bilingual rules

See [`.claude/skills/opsfluency-bilingual-content/SKILL.md`](../../.claude/skills/opsfluency-bilingual-content/SKILL.md) for the operational spec. Branding-specific notes:

- **Both languages are first-class.** Spanish is never shown as "the translation of" English — it stands alone. Never label Spanish content with "(ES)" or a flag icon as if it's subordinate.
- **`lang` attribute matters.** Every element rendering user-generated content in Spanish must carry `lang="es"`. It's a screen-reader signal, not a style hint — if it's missing, accessibility is broken.
- **Typography doesn't change across languages.** Same fonts, same sizes, same weights. Spanish tends to run ~15–20% longer than English — design for that at the wireframe stage, not after.
- **Flags are not language indicators.** The toggle is a text toggle: `EN | ES`. A flag represents a country, not a language; Mexican, Guatemalan, and Salvadoran workers read the same Spanish UI.

---

## 7. Imagery

**Photography direction:**

- Real warehouses and facilities. Natural lighting. Workers actually working.
- Diverse without posing — the team on the floor of a Midwest manufacturer or a Southeast distribution center actually looks like this.
- No polished stock imagery. No people pointing at laptops. No hard-hats worn backwards for a photographer.
- Gloves, safety vests, and equipment in frame are good signals.

**Illustration direction:**

- Rarely used. If used at all: isometric, single-line stroke, 2-color max (teal + neutral), matches icon weight.
- Never use emoji, 3D mascots, hero illustrations with characters.

**Screenshots for marketing:**

- Always show real bilingual content side by side, never placeholder Lorem Ipsum.
- Never blur out the core UI to look "futuristic" — the UI is the product.
- Monitor screenshots use dark mode. Dashboard screenshots use light mode.

---

## 8. Do / Don't

### Do

- Write UI copy that a shift lead reads in two seconds and acts on.
- Pair every color signal with an icon and a text label.
- Reference tokens (`--color-brand`, `--font-display`, `dc-text`) instead of hex or font names.
- Let Spanish set the line length; English will fit.
- Ship accessibility from day one — the verification commands in `CLAUDE.md` run on every UI PR.

### Don't

- Don't write generic B2B SaaS copy ("Transform your workforce…"). We're not that.
- Don't introduce a second blue, a second teal, or "just one more" semantic color. If you need a new role, document it in `globals.css` and add a row to §3 above.
- Don't mix icon libraries. Pick one and stick with it.
- Don't treat Spanish as a translation afterthought. It's content.
- Don't use the logo smaller than 120px on screen, rotated, recolored, or on a fail-contrast background.
- Don't add `dark:` prefixes to components that use `dc-*` tokens — the tokens already adapt.

---

## 9. Security messaging

**Technical backup:** [`docs/security.md`](../security.md) — the full control inventory, known gaps, and customer FAQ. If marketing copy and that doc disagree, the doc wins.

### The one claim that matters

Warehouse operators and their IT contacts ask one security question above all others: *"Can another company see our data?"* Every piece of security copy on the marketing site is an answer to that question.

### Approved copy — three tiers

**One line** (hero sections, pricing cards, feature bullets):
> "Your data is isolated at the database layer. No other company can see it — ever."

**Two sentences** (features page, FAQ accordion, sales one-pager):
> "Every company's data is isolated by PostgreSQL Row Level Security — enforced at the database itself, not just the application. Even a software bug cannot return another company's data."

**Trust block** (dedicated `/security` or `/trust` page, footer callout, sales email attachment):
> **Your data stays yours.**
>
> OpsFluency is built for multi-tenant isolation from the ground up. Every company's SOPs, glossary, and employee data are isolated at the database layer using PostgreSQL Row Level Security — not just filtered in code. Only your org admins can export your data, every export is logged, and files stream directly to your browser with no copy stored on our servers. All traffic is HTTPS-only with full security headers. Employees log in via magic link — there are no passwords to phish.
>
> Questions? security@opsfluency.com

### Voice rules for security copy

| Do | Don't |
|---|---|
| "Enforced at the database itself, not just the application" — this lands with technical buyers | "We take security seriously" — says nothing |
| Name the actual mechanism (Row Level Security, HTTPS, magic link) | "Enterprise-grade security" — meaningless filler |
| Be honest about what's in progress ("building toward SOC 2") | Imply you have certifications you don't have |
| Short sentences. One claim per sentence. | Long paragraphs that bury the key point |

### Where each tier goes

| Surface | Tier |
|---|---|
| Pricing page — below plan cards | One line |
| Features page — as a feature row | Two sentences |
| Homepage — optional trust strip near social proof | One line |
| `/security` or `/trust` page | Trust block + link to `docs/security.md` |
| Footer | Link to `/security` only — no inline copy |
| Sales email / proposal | Trust block as a standalone attachment |
| Security questionnaire responses | Full answers from `docs/security.md` → Customer FAQ |

### What we can truthfully claim right now

- ✅ Database-layer tenant isolation (RLS)
- ✅ HTTPS-only with HSTS and full security headers
- ✅ Magic link authentication — no passwords
- ✅ Admin-only data export, logged and rate-limited
- ✅ Every cross-tenant admin action is audited
- ⏳ SOC 2 — not yet; say "building toward SOC 2 Type II" if asked directly
- ⏳ Penetration test — not yet; say "scheduled" when it is

Never claim a certification or audit report that doesn't exist. A single customer who asks for the report and gets nothing loses trust permanently.

---

## Change log

| Date | Change |
|---|---|
| 2026-04-29 | Added §9 Security messaging — approved copy tiers, voice rules, placement guidance. |
| 2026-04-21 | Initial draft. Sections: positioning, logo, color, type, icons, bilingual, imagery, do/don't. |
