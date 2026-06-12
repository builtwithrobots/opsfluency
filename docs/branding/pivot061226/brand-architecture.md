# OpsFluency — Brand Architecture
> Pivot package 2026-06-12. Governs how the brand operates across two domains.
> Add as §11 in docs/branding/README.md.

---

## The Two-Domain Model

The consultancy reframe creates two distinct brand contexts under one brand identity. Same name, same Steel & Signal design system, same voice — but different emphasis, different audience entry points, and different CTAs.

| | opsfluency.com | app.opsfluency.com |
|---|---|---|
| **Primary audience** | Ops managers considering consulting services | Ops managers evaluating or using the platform |
| **Brand emphasis** | Rob first. Expertise. Trust. | Product first. Features. Flat pricing. |
| **What they're buying** | Rob's 22 years on their problem | A self-serve tool with a 14-day free trial |
| **Primary CTA** | "Talk to Rob" | "Start free trial" |
| **Secondary CTA** | "See the Platform" (→ app.opsfluency.com) | None (they're already in the product context) |
| **Tone emphasis** | Peer-to-peer, founder-credentialed, earned | Operational, benefit-driven, specific |
| **Social proof** | Rob's career results + case studies | Customer testimonials + platform metrics |

---

## How the Voice Adapts

The voice attributes stay constant across both domains. Tone adapts.

### opsfluency.com (consultancy)

Rob is the subject. His credentials are the proof. The platform is evidence of his expertise — not the product being sold.

**Tone dials:** Credibility high. Founder voice high. Peer-to-peer high. Product features low.

Example copy:
> "I've been a Warehouse Manager, an Operations Manager, and a Director of Operations across three states. I've launched four facilities from scratch. I went back to the floor by choice because that's where the real problems are. If your floor has one of those problems, let's talk."

### app.opsfluency.com (platform)

The product is the subject. Rob's expertise is visible in the product decisions — the glossary, the manager approval gate, the bilingual-first architecture — but the copy leads with what the product does, not who built it.

**Tone dials:** Benefit-driven high. Specific and operational high. Founder voice medium. Credibility via features, not bio.

Example copy:
> "Upload your SOP. AI converts it to structured Markdown in minutes. Your site-specific terms — equipment names, internal acronyms — get flagged before a single word is translated. Approve the Spanish. Print the QR. Stick it on the machine. Under 15 minutes per SOP."

---

## Navigation Structure

### opsfluency.com nav

`Home` · `What I Do` · `Tools` · `About` · `Contact`

- **Home** — Consultancy homepage. Rob-first hero, problem section, services, credibility, tools strip, CTA.
- **What I Do** — Three service lanes expanded. Operations Consulting, Platform Setup, Custom Tools.
- **Tools** — Cards for each tool. OpsFluency Platform as Tool #1. Placeholder for future tools.
- **About** — Rob's full story. Bio (long version), career timeline, philosophy.
- **Contact** — Form + "Talk to Rob" framing. Not a generic contact page.

### app.opsfluency.com nav (existing, reference only)

The existing platform nav is not changing. The SaaS product nav stays product-focused.

---

## Linking Between Domains

### From opsfluency.com → app.opsfluency.com

- Tools section: "OpsFluency Platform →" links to app.opsfluency.com
- Hero secondary CTA: "See the Platform →" links to app.opsfluency.com
- Never send consultancy visitors directly into the sign-up flow — send them to the platform marketing page first

### From app.opsfluency.com → opsfluency.com

- Footer: "Built by Rob Ramos | opsfluency.com" — light touch, no distraction from conversion
- About/company page (if it exists): link to opsfluency.com for Rob's full background

---

## The Three Service Lanes — Official Definitions

These are Rob's three ways to engage. Copy should stay close to these definitions.

### 1. Operations Consulting
**What it is:** On-site or remote. Workflow assessment, SOP development, process improvement, team alignment, Lean/5S/Kaizen implementation.

**Format:** Project-based or monthly retainer.

**Who it's for:** Facilities that need a clear-eyed outside assessment of what's broken and a plan to fix it. Rob has done this before — self-employed consulting practice, 2018–2019.

**One-liner:** "An experienced Director-level eye on your operation, without the full-time Director overhead."

### 2. Platform Setup
**What it is:** Full OpsFluency platform implementation. SOP import and conversion, company glossary setup, department configuration, QR code installation, manager training.

**Format:** One-time setup fee + platform subscription.

**Who it's for:** Facilities that want to implement the platform but want Rob to do it right the first time instead of figuring it out themselves.

**One-liner:** "The platform, implemented by the person who built it."

### 3. Custom Tools
**What it is:** Purpose-built applications for specific operational problems that don't fit an off-the-shelf product.

**Format:** Scoped per project. Discovery call → proposal → build → deploy.

**Who it's for:** Facilities with a specific workflow or compliance problem that no existing tool solves.

**One-liner:** "If the right tool doesn't exist yet, I'll build it."

---

## Social Proof — Which Domain Gets What

### opsfluency.com
- Rob's career metrics (from founder-voice.md — pre-approved copy)
- Client testimonials (consulting engagements)
- Case studies framed around Rob's involvement: "Here's the operation. Here's what we found. Here's what changed."

### app.opsfluency.com
- Platform user testimonials: "We published 12 SOPs in a week" type of quotes
- Time-to-publish metrics
- OSHA compliance stories
- Scan analytics / usage proof

### Rules for testimonials
- Always include title + facility type (never name + company if customer hasn't approved)
- Short. One to three sentences. A specific result, not "it's great."
- Platform testimonials: lead with the result ("We cut re-explanation time by half"), follow with context
- Consulting testimonials: lead with the problem ("We had 80% turnover in 60 days"), follow with what changed

---

## What Stays the Same Across Both Domains

- Steel & Signal design system (teal, signal colors, Chakra Petch, Inter, JetBrains Mono)
- Banned phrases (see go-to-market.md §10)
- Bilingual principles (Spanish is first-class, not subordinate)
- Security messaging tiers (see branding/README.md §9)
- Voice attributes (direct, credentialed, peer-to-peer, specific)

---

## Change Log

| Date | Change |
|---|---|
| 2026-06-12 | Initial draft. Two-domain model, nav, service lane definitions, social proof guidance. Pivot package. |
