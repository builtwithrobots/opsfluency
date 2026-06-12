# INSTRUCTION FILE — Drop into Claude Code to Refactor docs/branding/README.md
> Pivot package 2026-06-12.
> This file tells Claude Code exactly what to add to the existing brand guide.
> Drop this file in the repo root alongside CLAUDE.md and say:
> "Follow REFACTOR-BRANDING-README.md to update docs/branding/README.md."

---

## What This Does

Updates `docs/branding/README.md` to reflect the consultancy pivot. Adds four new sections without touching or removing any existing section. The existing content (color, typography, logo, icons, bilingual, imagery, do/don't, security) stays exactly as-is.

**Files to read before making changes:**
1. `docs/branding/pivot061226/brand-vision.md` — vision, positioning, tagline content
2. `docs/branding/pivot061226/founder-voice.md` — Rob's credentials and voice rules
3. `docs/branding/pivot061226/brand-architecture.md` — two-domain model

**File to update:**
- `docs/branding/README.md`

**Files to create:**
- None. All new content goes into the existing brand guide.

---

## Precise Instructions

### Step 1 — Update the header of §1 (Positioning & voice)

In `docs/branding/README.md`, find the existing §1 section. It currently begins:

```
## 1. Positioning & voice
```

Replace the existing §1 content (everything from `## 1. Positioning & voice` through the end of the Manifesto lines block) with the following updated version. Do not touch §2 (Logo) or any section after it.

---

**New §1 content to write:**

```markdown
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
```

---

### Step 2 — Append §10 (Founder Voice) after the existing §9 (Security messaging)

Find the end of §9 in `docs/branding/README.md` (the security section ends before the Change log). Insert the following new section between §9 and the Change log:

```markdown
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
```

---

### Step 3 — Append §11 (Brand architecture) after the new §10

Insert the following section after §10 and before the Change log:

```markdown
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
```

---

### Step 4 — Update the Change log

Add this row to the top of the Change log table in `docs/branding/README.md`:

```markdown
| 2026-06-12 | Consultancy pivot update. §1 rewritten with vision, tagline, and "fluency" double-meaning. §10 (Founder Voice), §11 (Brand Architecture) added. Source: pivot061226 package. |
```

---

## Verification

After making the changes, confirm:
- [ ] `docs/branding/README.md` has 11 numbered sections
- [ ] §1 now includes Brand Vision, Canonical Tagline, and "Fluency" double-meaning
- [ ] §2 through §9 are unchanged
- [ ] §10 Founder Voice is present with credentials table and approved bio
- [ ] §11 Brand Architecture is present with the two-domain table
- [ ] Change log has a 2026-06-12 entry at the top
- [ ] No hex values or font names introduced outside of `globals.css` references (existing rule)
- [ ] Run `npx tsc --noEmit` — no TypeScript changes in this update, should pass

---

## Do Not Touch

- `app/globals.css` — no changes
- `docs/marketing/go-to-market.md` — separate update, not part of this task
- Any file in `app/`, `lib/`, `components/`, or `supabase/`

---

## After This Task

Run the LinkedIn playbook updates next:
> "Read docs/branding/pivot061226/linkedin-playbook.md and add a §8 (LinkedIn) to docs/marketing/go-to-market.md §7 Channel Strategy, following the same format as existing sections."

Run the homepage copy next:
> "Read docs/branding/pivot061226/consultancy-homepage.md and implement the copy in app/(marketing)/page.tsx following the CONSULTANCY-REFRAME.md Phase 2 spec."
