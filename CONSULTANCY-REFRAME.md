# CONSULTANCY-REFRAME.md — OpsFluency
# Current state of the consultancy reframe and outstanding work
# Drop this in the repo root alongside CLAUDE.md
# Last updated: June 2026

---

## What This Document Is

This is the living strategic plan for opsfluency.com as a consultancy
homepage. It reflects current state accurately and tracks what still
needs to be built. Claude Code sessions working on the marketing site
should read this file alongside CLAUDE.md before touching any code.

---

## The Business

OpsFluency is the consulting practice and toolset of Rob Ramos --
20+ years of warehouse, manufacturing, and 3PL operations leadership
from floor to Director level. The business has four engagement types
and one flagship platform tool.

**The positioning:** Rob is an operations expert who built tools to
back it up. The site leads with the person and the expertise. The
platform is proof of capability, not the centerpiece of the pitch.

**Target client:** Operations managers, plant managers, and business
owners at warehouse, manufacturing, and 3PL facilities with 50-200
employees, often multi-shift, often with bilingual workforces.

---

## Domain Structure (COMPLETE)

| URL | What Lives There | Status |
|---|---|---|
| opsfluency.com | Consultancy homepage | Live |
| app.opsfluency.com | SaaS platform | Live |
| [future].opsfluency.com | Future tools | Not yet built |

The domain split is done. app.opsfluency.com is live and operational.
NEXT_PUBLIC_APP_URL is set to https://app.opsfluency.com.

---

## Current Site Structure

### Pages currently live

| Page | URL | Status |
|---|---|---|
| Home | opsfluency.com | Live -- needs updates below |
| What I Do | opsfluency.com/what-i-do | Being replaced by /services |
| Tools | opsfluency.com/tools | Live -- needs expansion |
| About | opsfluency.com/about | Live -- needs updates below |
| Contact | opsfluency.com/contact | Live -- needs minor updates |
| Features | opsfluency.com/features | Live -- platform focused, keep as-is |
| Pricing | opsfluency.com/pricing | Live -- platform pricing only, keep as-is |
| How It Works | opsfluency.com/how-it-works | Live -- platform focused, keep as-is |
| Privacy | opsfluency.com/privacy | Stub -- needs real content |
| Terms | opsfluency.com/terms | Stub -- needs real content |

### Current nav links
- What I Do (being renamed to Services)
- Tools
- About
- Contact
- Talk to Rob (CTA button)

---

## What Is Already Done

- opsfluency.com live as consultancy homepage
- app.opsfluency.com live as platform subdomain
- Hero: "Your floor is running on tribal knowledge" -- strong, keep
- Client complaint quotes section -- strongest section on site, keep
- Founder credibility section with stats -- keep
- Three ways to work together section -- being expanded to four
- Tools section on homepage -- keep
- Final CTA section -- keep
- About page founder story -- strong, keep as-is
- Contact page with form and FAQ -- keep, minor updates needed
- Nav "Talk to Rob" CTA button -- keep

---

## Outstanding Work by Priority

---

### PRIORITY 1 -- Services Page (replaces What I Do)
Prompt file: SERVICES-PAGE-PROMPT.md

The /what-i-do page is being replaced with a /services page using a
three-column tier card layout similar to a SaaS pricing page -- but
with no pricing, no dollar amounts anywhere.

Three columns:
- Operations Consulting (left)
- Fractional Leadership (center, featured)
- Custom App Solutions (right)

Below the tier cards: a feature comparison table showing what is
included in each engagement type.

Key rules:
- No pricing anywhere on this page
- Fractional Leadership is the featured center column
- /what-i-do must redirect (301) to /services
- Nav link renamed from "What I Do" to "Services"

Status: Prompt written (SERVICES-PAGE-PROMPT.md), ready to execute.

---

### PRIORITY 2 -- Homepage Updates

The homepage is live and largely strong. These specific updates are
needed but have not been built yet.

**2a. Add Fractional Leadership to services section**

Currently shows three engagement types. Needs to become four with
Fractional Leadership added as the first card.

New card copy for Fractional Leadership:
"Most facilities do not have a leadership gap. They have a systems
gap. I come in, assess where decisions are breaking down, and build
the workflows and processes your existing team needs to own the
operation themselves. No new layers of management. No dependency on
me staying. When the engagement ends, your supervisors and mid-level
managers are making better decisions, holding each other accountable,
and running a floor that does not need me in the room. That is the
whole point."

Detail line: "Weekly or bi-weekly engagement. Minimum three months."

Section heading change: "Three ways to work together" becomes
"Four ways to work together."

**2b. Replace "Photo coming" placeholder**

The founder section currently shows "Photo coming" as raw text.
This must be replaced with Rob's actual headshot when available.
The component should be built so a real image swaps in via a
single file path change.

**2c. Remove "SDR" language from contact page and any other page**

Replace with plain language ops managers understand:
"You are not talking to a receptionist or a sales rep.
You are talking to Rob."

**2d. Fix compliance badge context**

OSHA, ISO 9001, and cGMP badges appear without explanation.
Add one line below them:
"Rob has led audits under all three standards with zero
non-conformances."

Status: Not yet built.

---

### PRIORITY 3 -- About Page Updates

The About page is strong. Three specific updates needed.

**3a. Update opening to lead with Rob, not the product**

Current opening leads with the product. The About page should
lead with Rob.

New opening paragraph:
"I am not a consultant who found an interesting industry. I spent
twenty years in it -- from the floor to Director of Operations across
three simultaneous sites. I built OpsFluency because I needed it and
it did not exist. Now I use it with every client."

**3b. Add "How I Work" section**

Replace or follow the roadmap section with a section explaining what
an engagement actually looks like.

Three steps:
Step 1 -- The first conversation (free, 30 minutes, honest assessment)
Step 2 -- The discovery (half-day, written findings report in 5 days)
Step 3 -- The work (scoped together, direct access to Rob, no
account manager in the middle)

**3c. Fix secondary CTA button**

The "Start a free trial" button currently links to /sign-up.
Update to https://app.opsfluency.com/sign-up (external link).

Status: Not yet built.

---

### PRIORITY 4 -- Tools Page Expansion

The Tools page is currently thin. Needs more substance.

**Additions needed:**

Feature bullets for the OpsFluency Platform:
- Bilingual SOPs in English and Spanish, AI-converted from existing
  documents
- Company glossary that learns site-specific terminology and persists
  across every future translation
- QR codes tied to locations and equipment, not individual SOPs --
  content accumulates without reprinting
- Worker PWA with magic-link sign-in, no app store download required
- OSHA-compliant comprehension records and scan analytics
- Flat rate per facility, unlimited workers, unlimited SOPs

Expand "More tools coming" section:
"Current candidates include a shift handoff tracker, a compliance
audit checklist builder, and a visual work instruction generator
for equipment with no written SOP."

Add pricing callout (no amounts -- link to pricing page):
"Flat rate per facility. No per-seat fees. See full pricing."

Status: Not yet built.

---

### PRIORITY 5 -- Contact Page Minor Updates

**5a. Replace SDR language** (same as Priority 2c)

**5b. Add optional field to contact form**
New optional textarea after the Message field:
Label: "What are you trying to fix? (optional)"
Placeholder: "Briefly describe the main operational problem you are
dealing with. This helps Rob come prepared."

**5c. Add two consulting-specific FAQ entries**

New FAQ 4:
Q: "What does a typical consulting engagement look like?"
A: "It starts with a half-day discovery session, on-site or via
video. I give you a written findings report within five business
days. From there we scope the work together -- project, retainer,
or fractional depending on what you actually need."

New FAQ 5:
Q: "Do you work with facilities outside Utah?"
A: "Yes. Most consulting work is remote-first with on-site visits
as needed. Travel is scoped into the project cost upfront so there
are no surprises."

Status: Not yet built.

---

### PRIORITY 6 -- Legal Pages

Both pages are currently stubs. Must be replaced with real content
before any paid client is onboarded.

**Privacy Policy** (/privacy)
Must cover: data collected, how it is used, third party processors
(Clerk, Supabase, Anthropic, Google Cloud), retention and deletion
rights, contact for privacy requests.

**Terms of Service** (/terms)
Must cover: description of service, acceptable use, payment terms,
data ownership (clients own their SOP content), limitation of
liability, termination.

Do not use generic templates verbatim. Customize to reflect what
OpsFluency actually does with data.

Status: Not yet built. Blocks paid client onboarding.

---

### PRIORITY 7 -- Contact Form Email Notifications

The contact form logs submissions silently. Rob receives no email
when someone fills it out.

Fix: Wire in Resend (resend.com) for email delivery.

Environment variables needed:
RESEND_API_KEY=
CONTACT_NOTIFICATION_EMAIL=rob@opsfluency.com

Status: Not yet built. Blocks real inbound lead capture.

---

### PRIORITY 8 -- Payment Processing

No payment infrastructure exists yet.

Manual flow for early clients (use this now):
1. Close the deal verbally or by email
2. Create a Stripe Payment Link in the Stripe dashboard (no code)
3. Send the client the payment link via email
4. Client pays
5. Rob manually creates their account in the super admin panel
   at app.opsfluency.com/dashboard/platform
6. Client is live

Full Stripe integration deferred until after five paying clients.

Status: Manual process in place. Full automation is later phase.

---

## Componentization Standard

Every marketing page must be broken into individual section
components so sections can be edited independently.

Pattern:
- Components live in components/marketing/[pagename]/
- Page files in app/(marketing)/[pagename]/page.tsx compose them
- Each component is one section of the page

Pages already componentized:
- Home (components/marketing/home/)
- About (components/marketing/about/)
- Contact (components/marketing/contact/)
- Features (components/marketing/features/)
- Pricing (components/marketing/pricing/)
- How It Works (components/marketing/how-it-works/)

Pages needing new component folders:
- Services (components/marketing/services/) -- new
- Tools (components/marketing/tools/) -- new

---

## Four Engagement Types (Reference for All Copy)

1. **Fractional Operations Leadership**
Rob builds the workflows and accountability structures the existing
team needs to own the operation themselves. No new management layers.
No dependency on Rob staying. Weekly or bi-weekly. Minimum 3 months.

2. **Operations Consulting**
Workflow assessment, SOP development, process redesign, team
alignment. Starts with a half-day discovery and written findings
report. Project-based or retainer. On-site or remote.

3. **Platform Setup**
Full OpsFluency platform implementation. SOP import, glossary setup,
bilingual publishing, QR code installation, manager training.
One-time setup plus monthly subscription.

4. **Custom App Solutions**
Purpose-built applications for specific operational problems.
Scoped per project. Discovery call then proposal then build.

---

## Credibility Proof Points (Use in All Copy)

- 20+ years warehouse, manufacturing, logistics, and 3PL operations
- Floor to Director of Operations, three simultaneous sites (NV, OK, PA)
- Scaled a facility 3X in 90 days
- 99%+ order accuracy and on-time delivery at every site managed
- Zero lost-time incidents across full career
- ISO 9001 and cGMP audits, zero non-conformances
- Six facility start-ups from lease signing to first product out
- 10+ years P&L and CAPEX management
- Outstanding Contributor Award 2016, presented by CEO

---

## What Not to Touch During Marketing Sessions

- app/app/ (worker PWA)
- app/dashboard/ (manager dashboard)
- app/api/ (API routes)
- lib/ (all library code)
- supabase/ (database migrations)
- components/dashboard/
- components/sop/
- components/qr/
- components/ui/ (shared primitives)
- proxy.ts
- Any Clerk or Supabase configuration

---

## Session Startup Checklist

At the start of any Claude Code session on the marketing site:

1. Read CLAUDE.md
2. Read this file (CONSULTANCY-REFRAME.md)
3. Check Outstanding Work above for current priorities
4. Confirm which priority you are working on
5. Do not touch files outside the scope of that priority
6. Run npx tsc --noEmit after any TypeScript change
7. Run npm run lint before opening a PR
8. Verify the Vercel preview URL before marking complete
9. Run npx @axe-core/cli against the preview URL for any UI changes
