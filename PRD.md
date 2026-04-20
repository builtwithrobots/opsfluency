# OpsFluency

> Making every frontline worker competent from Day 1 — regardless of what language they speak.

---

## What Is OpsFluency?

OpsFluency is a frontline knowledge and engagement platform for multilingual warehouse and manufacturing facilities.

It combines three things no competitor offers together:

- **Bilingual SOP publishing** — upload existing docs, AI converts them, workers read in their language
- **QR-triggered learning** — physical QR codes on equipment link directly to the right procedure
- **Departmental communication** — manager announcements, monitor displays, and HR chat in one place

Built for the squeezed middle manager who needs results tomorrow, not after a 6-month enterprise rollout.

**$149/month. Live in 24 hours. No hardware required.**

---

## The Problem

Workers do not quit for fifty cents more per hour. They quit because they are frustrated and embarrassed.

- New hires nod through English-only training they do not understand
- They make mistakes, feel incompetent, and are afraid to ask questions
- Supervisors spend 17+ hours per week re-explaining the same procedures
- By week 8, the worker quits — and everyone blames pay

The real problem is dignity and competence. OpsFluency fixes both.

---

## Core Features (MVP)

| Feature | What It Does |
|---|---|
| SOP Import | Upload PDF, Word, or text docs |
| AI Conversion | Claude Sonnet converts to structured Markdown |
| Glossary Flagging | Site-specific terms flagged for manager review before translation |
| Bilingual Publishing | English + Spanish, manager-approved before going live |
| QR Codes | One permanent QR per SOP, printable with custom layout |
| Worker PWA | Mobile web app, no download required, works offline |
| Magic Link Auth | Workers log in via SMS/email link, no password needed |
| Monitor System | TV displays paired via QR, departmental dashboards |
| HR Module | HR SOPs, contacts directory, worker-to-HR chat |
| Scan Analytics | Who viewed what, when, in which language |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js App Router (TypeScript) |
| Styling | Tailwind CSS |
| Auth | Clerk Organizations |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| AI Conversion | Claude Sonnet API |
| Translation | Google Cloud Translation API |
| QR Codes | qrcode.react |
| PWA | next-pwa |
| Deployment | Vercel |

---

## How It Works

### For Managers

1. Upload an existing SOP (PDF, Word, or text)
2. AI converts it to structured Markdown and flags site-specific terms
3. Define flagged terms — they are saved to your company glossary forever
4. Review and edit the Markdown, select a display template
5. System translates to Spanish using your glossary for accuracy
6. Approve the Spanish version and publish
7. Print the QR code and mount it at the equipment or station

Total time: under 15 minutes per SOP.

### For Workers

1. Receive a magic link from their manager (expires in 72 hours)
2. Tap the link — logged in automatically, no password
3. See manager announcements in their language on the home dashboard
4. Scan any QR code on the floor to open that procedure instantly
5. Read in English or Spanish, toggle between them anytime
6. Previously viewed SOPs work offline

---

## SOP Templates

| Template | Best For |
|---|---|
| Step-by-Step Procedure | Equipment operation, operational tasks |
| Reference Document | Policies, multi-section guides |
| Safety Checklist | Lockout/tagout, PPE, hazard procedures |
| Onboarding Document | New hire welcome, orientation materials |

---

## Default Departments

Every account starts with four departments. Managers add more as needed.

- Safety
- Equipment
- Process
- HR (includes contacts directory and worker chat)

---

## User Roles

| Role | Access |
|---|---|
| Org Admin | Full access — billing, settings, all departments |
| Manager | Create SOPs, invite workers, post announcements, pair monitors |
| Worker | View SOPs, scan QR codes, view announcements, HR chat |

---

## Pricing

| Tier | Employees | Monthly (Annual) | Monthly (M-t-M) |
|---|---|---|---|
| Starter | Up to 50 | $79 | $99 |
| Growth | 51–150 | $119 | $149 |
| Scale | 151–500 | $199 | $249 |
| Enterprise | 500+ | Custom | Custom |

Flat-rate. No per-user fees. Growth tier is expensable without committee approval.

---

## Environment Variables

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Google Cloud Translation
GOOGLE_CLOUD_TRANSLATION_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

---

## Project Structure

```
opsfluency/
├── app/
│   ├── (auth)/              # Clerk auth pages
│   ├── dashboard/           # Manager-facing pages
│   │   ├── sops/
│   │   ├── import/
│   │   ├── glossary/
│   │   ├── workers/
│   │   ├── announcements/
│   │   ├── departments/
│   │   ├── monitors/
│   │   └── analytics/
│   ├── app/                 # Worker-facing PWA
│   │   ├── home/
│   │   ├── sop/[id]/
│   │   ├── scan/
│   │   ├── hr/
│   │   └── search/
│   ├── monitor/[id]/        # TV monitor display
│   ├── pair-monitor/        # Monitor pairing flow
│   └── api/
├── lib/
│   ├── auth/
│   ├── supabase/
│   ├── ai/
│   ├── translation/
│   ├── qr/
│   └── types/
├── components/
│   ├── sop/
│   ├── monitor/
│   ├── dashboard/
│   └── ui/
├── public/
│   ├── manifest.json
│   └── sw.js
├── CLAUDE.md                # AI session memory — read before every session
└── PRD.md                   # Full product requirements document
```

---

## Development Workflow

This project uses a cloud-first, no-localhost development workflow.

- All development happens through Claude Code
- Changes go directly to GitHub
- Vercel auto-deploys on every push to `main`
- Preview deployments on all branches

No local dev environment needed.

---

## Documentation

| File | Purpose |
|---|---|
| `README.md` | This file — project overview |
| `CLAUDE.md` | Claude Code session memory — architecture, decisions, patterns |
| `PRD.md` | Full product requirements document |

---

## Roadmap

**Phase 2 (post-MVP):**
- Additional languages (Vietnamese, Mandarin, Portuguese, Arabic)
- Loom and Scribe integrations for video SOPs
- Voice search in native language
- Production management board monitor module
- Dock efficiency board module
- Advanced analytics and OSHA compliance exports
- HRIS integrations (ADP, Paychex, Gusto)
- Required reading assignments with completion tracking

---

Built by Rob — 20 years of operations leadership experience, now building the tools that should have existed all along.
