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

### Brand vision

> **"Every worker on every floor — regardless of what language they speak — deserves procedures they can actually understand. OpsFluency is the infrastructure to make that true."**

This is the north star. It governs the consultancy practice, the platform, and every future tool built under the OpsFluency name. When copy drifts toward feature lists or generic SaaS language, come back to this sentence.

### Canonical tagline

**"Fluent in Your Floor."**

Two meanings, both true:
1. **Language fluency** — workers reading procedures in the language they actually speak
2. **Operational fluency** — a facility where knowledge reaches the floor without a supervisor re-explaining it

Usage: standalone sign-off on LinkedIn, email signatures, and the marketing site footer. Both words capitalized in display. Lower case in running copy: "We've been doing this for 22 years. We're fluent in your floor."

### Positioning

**Category:** Operations intelligence for America's bilingual manufacturing floor.

**One-line pitch:** "Yourco broadcasts messages. OpsFluency enables competence."

**What it is:** Operations infrastructure. The system that gets the right procedure, in the right language, in front of the right worker, at the machine — without a supervisor standing there explaining it again.

**What it is not:** A translation tool. A learning management system. A compliance broadcaster. A per-seat HR platform.

**Who it's for:** Operations managers at 50–500-worker bilingual facilities where the floor is English + Spanish and SOPs live in drawers, binders, and tribal knowledge.

**Who it's not for:** Corporate L&D departments, HR compliance broadcasters, single-language teams, per-seat SaaS buyers.

### Voice

| Dimension | We are | We are not |
|---|---|---|
| Tone | Direct, confident, operations-native | Chirpy, corporate, jargon-laden |
| POV | "Your managers publish. Your workers learn." | "Empower your workforce with AI-driven insights." |
| Posture | Industrial precision, frontline fluency | Startup-optimistic, trend-chasing |
| Vocabulary | SOP, floor, shift, scan, published | "Content," "experiences," "journeys," "wellness" |

**Write like a plant manager talking to another plant manager.** Short sentences. Verbs over adjectives. Numbers when they exist. Never apologize for being about warehouses.

### "Fluency" — own both meanings

The name carries a deliberate double meaning. Both are available in copy depending on context — never over-explain, let it land.

- **Language fluency:** Workers speak Spanish. SOPs are in English. That gap is where accidents, turnover, and compliance failures live. OpsFluency closes it.
- **Operational fluency:** A fluent operation is one where knowledge reaches the people who need it, at the moment they need it, without re-explanation. That is what Rob builds.

In consultancy context: lean on operational fluency. In platform context: lean on language fluency. Combined: "The floor already speaks two languages. Your systems should too."

### Manifesto lines (approved for marketing surfaces)

| Line | Best surface | Job |
|---|---|---|
| "Bilingual by default. Because your floor already is." | Hero sections, feature headlines, LinkedIn | Positions against English-only competitors |
| "Yourco broadcasts messages. OpsFluency enables competence." | Sales deck, hero subhead, email subject | Sharpest contrast vs. generic tools |
| "The translation runs once. The understanding compounds forever." | Glossary feature, pricing page | Explains the compound-interest engine |
| "I built this because I lived this." | About page, credibility section, LinkedIn | Rob's personal brand statement |
| "Fluent in Your Floor." | Tagline, footer, email signature | Brand identity anchor |

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

## 10. Founder voice

Rob is the brand differentiator. His voice and credentials belong in the brand guide.

**The core rule:** All OpsFluency copy should feel like it came from someone who has been on a warehouse floor at 2am trying to figure out why the pick rate dropped. Not from a marketing department. Not from a generic thought leader.

### What Rob sounds like

| He says | He does not say |
|---|---|
| "I've rewritten that SOP three times and nobody read it — I get it." | "We understand the challenges facing today's workforce." |
| "The problem isn't pay. It's dignity and competence." | "Employee empowerment drives engagement." |
| "A 200-worker floor at $119/month. Done." | "Scalable, cost-effective solutions." |
| "I ran three sites at once. I know what breaks." | "Leveraging synergies across multi-location deployments." |
| "I built this because the tool didn't exist." | "Disrupting the operations intelligence category." |

### Approved credentials (pre-cleared for marketing copy — use these, not approximations)

- "22 years in warehouse, manufacturing, and fulfillment operations"
- "Director of Operations across three sites simultaneously — Nevada, Oklahoma, and Pennsylvania"
- "Launched four operations from scratch, including one from lease signing to first product in market in under 120 days"
- ">99% order accuracy, sustained across multiple roles and facilities"
- "Zero lost-time incidents — maintained across every site managed"
- "ISO 9001 and cGMP implementations — zero non-conformances on every audit"
- "30% improvement in operational efficiency and output" (Nature's Distribution)
- "30% cost reduction without cutting revenue" (Nature's Distribution)
- "Outstanding Contributor Award, 2016 — presented by CEO"

### Approved bio — short version (50 words)

> Rob Ramos has spent 22 years building and fixing warehouse and manufacturing operations — from cold-start fulfillment centers to a three-state Director role. He built OpsFluency because the tool didn't exist when he was on the floor. Now it does.

For medium and long versions, see `docs/branding/pivot061226/founder-voice.md`.

### Photo direction

Facility setting preferred over studio. Working attire, not a suit. Direct eye contact — the expression of someone who has solved a hard problem before and will again. No posed laptop-holding. No hard-hat worn backwards for a photographer.

---

## 11. Brand architecture — two-domain model

The consultancy pivot creates two distinct brand contexts under one brand identity.

| | opsfluency.com | app.opsfluency.com |
|---|---|---|
| **Primary audience** | Ops managers considering consulting services | Ops managers evaluating or using the platform |
| **Brand emphasis** | Rob first. Expertise. Trust. | Product first. Features. Flat pricing. |
| **Primary CTA** | "Talk to Rob" | "Start free trial" |
| **Tone emphasis** | Peer-to-peer, founder-credentialed | Operational, benefit-driven, specific |

### Voice adaptation by domain

**opsfluency.com (consultancy):** Rob is the subject. Credentials are the proof. The platform is evidence of expertise.
> "I've been a Warehouse Manager, an Operations Manager, and a Director of Operations across three states. If your floor has a problem I've already solved, let's talk."

**app.opsfluency.com (platform):** The product is the subject. Copy leads with what it does.
> "Upload your SOP. AI converts it in minutes. Site-specific terms get flagged before translation runs. Approve the Spanish. Print the QR. Under 15 minutes per SOP."

### What stays the same across both domains

Steel & Signal design system · banned phrases (go-to-market.md §10) · bilingual principles (§6 above) · security messaging tiers (§9 above) · voice attributes (direct, credentialed, peer-to-peer, specific)

For the full brand architecture spec including nav structure, service lane definitions, and social proof guidance, see `docs/branding/pivot061226/brand-architecture.md`.

---

## Change log

| Date | Change |
|---|---|
| 2026-06-12 | Consultancy pivot update. §1 rewritten with vision, tagline, and "fluency" double-meaning. §10 (Founder Voice), §11 (Brand Architecture) added. Source: pivot061226 package. |
| 2026-04-29 | Added §9 Security messaging — approved copy tiers, voice rules, placement guidance. |
| 2026-04-21 | Initial draft. Sections: positioning, logo, color, type, icons, bilingual, imagery, do/don't. |
