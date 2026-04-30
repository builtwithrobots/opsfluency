# OpsFluency — pricing & unit economics

> Last updated: April 2026 — revised to correct Haiku+Sonnet label (architecture is Sonnet+Sonnet;
> Haiku was evaluated and rejected on quality grounds). Cache pricing split into write ($3.75/M)
> and read ($0.30/M) to match `ai_call_log` tracking added in PR #220. Annual cost range
> tightened to $10–40/tenant based on simulation against real org size profiles.
>
> **⚠ Pricing tier conflict:** this doc previously used $149 Starter / $349 Pro. PRD.md currently
> shows $79 / $119 / $199 / $249. Reconcile these before any external pricing page is published —
> the unit-economics math below uses the PRD tiers until that decision is made.

---

## TL;DR

- **Model: flat subscription per facility / location.** No per-user, no per-SOP metering for MVP.
- **Tiers (from PRD.md — pending reconciliation with earlier $149/$349 proposal):**

  | Tier | Employees | Annual/mo | MTM/mo |
  |---|---|---|---|
  | Starter | ≤ 50 | $79 | $99 |
  | Growth | 51–150 | $119 | $149 |
  | Scale | 151–500 | $199 | $249 |
  | Enterprise | 500+ | Custom | Custom |

- **Why flat:** AI cost is small enough to absorb (~$10–40/tenant/year depending on org size and activity), and metering creates more friction than savings at MVP scale. Customers buy *outcomes* (worker safety, training velocity), not tokens.
- **Rule of thumb: $0.05/page** (full pipeline: Sonnet conversion + Sonnet flagging + Google translation). Both calls use Sonnet — Haiku was evaluated for Call 1 and rejected on quality grounds.

---

## Real measured AI cost per SOP

### Architecture (current — as of PR #135)

SOP import now runs **two Claude calls** per document, not one:

| Call | Model | Task | max_tokens |
|---|---|---|---|
| 1 | `claude-sonnet-4-6` | Raw document → clean Markdown | 16,384 |
| 2 | `claude-sonnet-4-6` | Markdown + glossary → flagged site-specific terms | 4,096 |

Sonnet for both steps — SOPs are safety-critical documents and managers should not need to proof the Markdown output for structural errors. The quality floor matters more than the cost difference (~$4 on a 100-SOP onboarding).

Call 2's input is the compact Markdown (not the raw document), so the split is still cheaper than the original single-call design. Both calls use `cache_control: { type: 'ephemeral' }` on the system prompt — cached reads pay $0.30/M instead of $3/M on Sonnet input tokens.

### Pricing used

| Provider | Model | Input | Output | Cache write | Cache read |
|---|---|---|---|---|---|
| Anthropic | claude-haiku-4-5-20251001 | $1.00 / M tokens | $5 / M tokens | $1.25 / M tokens | $0.10 / M tokens |
| Anthropic | claude-sonnet-4-6 | $3.00 / M tokens | $15 / M tokens | $3.75 / M tokens | $0.30 / M tokens |
| Google | Cloud Translation v2 | $20 / M **source characters** | $0 (source only) | — | — |

### Measured cost — 2 × five-page PDFs (Cold Storage Pro, live data)

| Component | Measured cost | Per SOP |
|---|---|---|
| Anthropic — conversion + flagging (old single-Sonnet) | $0.2171 | $0.109 |
| Google Translation | $0.3352 | **$0.168** |
| **Total (old architecture)** | **$0.5523** | **$0.276** |

Restated for the current two-call architecture (Sonnet + Sonnet):

| Component | Estimated cost | Per SOP |
|---|---|---|
| Sonnet — Markdown conversion (Call 1) | ~$0.058 | $0.058 |
| Sonnet — term flagging, Markdown input only (Call 2) | ~$0.019 | $0.019 |
| Google Translation | ~$0.168 | $0.168 |
| **Total (current architecture)** | **~$0.245** | **~$0.245** |

**Cost per page: ~$0.05.** Holds well for 3–10 page SOPs.
Short SOPs (1–2 pages) run slightly higher per page because the system prompt is fixed overhead regardless of document length.

### Where cost actually lives

The critical finding: **Google Translation is 61% of total cost**, not Anthropic.

- The two-call split (raw doc → Markdown, then Markdown → flagged terms) reduces the Anthropic component vs a single combined call, because Call 2 takes compact Markdown as input rather than the full raw document.
- It reduces *total* cost by ~27% — the remainder is Google, which is fixed per character and cannot be reduced without degrading translation quality.
- Translation cost scales with SOP length, not SOP count. A 10-page SOP costs ~2× a 5-page SOP to translate.

### What drives Google translation cost

| Characters per SOP | Google cost |
|---|---|
| 2,000 (short, ~2 pages) | $0.04 |
| 5,000 (medium, ~4 pages) | $0.10 |
| 8,400 (measured 5-page PDF) | $0.17 |
| 12,000 (dense 8–10 page SOP) | $0.24 |

---

## Tenant cost projections

Based on measured $0.05/page (Sonnet+Sonnet architecture) across a typical SOP library:

| Stage | Volume | AI cost |
|---|---|---|
| Onboarding burst (week 1–2) | 30–60 SOPs × 5 pages | $6–12 one-time |
| Steady state (month 2+) | 3–5 new SOPs / month | $0.60–1.00 / month |
| Revisions + re-translations | ~10 SOPs / month | $1.68 / month |
| **Year 1 total per tenant** | ~80 SOPs + ongoing | **~$35–50** |

Heavy outlier — a Scale customer rebuilding their full 150-SOP library: 750 pages × $0.04 = **$30 one-time**. Still inside a single month's subscription.

---

## Margin math

Using PRD.md tiers and real measured AI costs. "Typical" = steady-state (3 new SOPs + 10 revisions/month). "Heavy" = active revision month (5 new + 25 revisions).

### Starter ($79/mo annual)

| Line item | Typical | Heavy |
|---|---|---|
| AI — Anthropic | $0.35 | $0.80 |
| AI — Google Translation | $1.80 | $5.04 |
| Stripe/Paddle fees (~3%) | $2.37 | $2.37 |
| Vercel (serverless + bandwidth) | ~$1.00 | ~$1.00 |
| Supabase (storage + bandwidth) | ~$0.50 | ~$0.50 |
| **Total COGS** | **~$6.02** | **~$9.71** |
| **Gross margin** | **~92%** | **~88%** |

### Growth ($119/mo annual)

| Line item | Typical | Heavy |
|---|---|---|
| AI — Anthropic | $0.60 | $1.40 |
| AI — Google Translation | $2.50 | $6.72 |
| Stripe/Paddle fees (~3%) | $3.57 | $3.57 |
| Vercel | ~$1.00 | ~$1.00 |
| Supabase | ~$0.75 | ~$0.75 |
| **Total COGS** | **~$8.42** | **~$13.44** |
| **Gross margin** | **~93%** | **~89%** |

### Scale ($199/mo annual)

| Line item | Typical | Heavy |
|---|---|---|
| AI — Anthropic | $1.00 | $2.40 |
| AI — Google Translation | $3.36 | $10.08 |
| Stripe/Paddle fees (~3%) | $5.97 | $5.97 |
| Vercel | ~$1.50 | ~$1.50 |
| Supabase | ~$1.00 | ~$1.00 |
| **Total COGS** | **~$12.83** | **~$20.95** |
| **Gross margin** | **~94%** | **~89%** |

All tiers hold **≥ 88% gross margin** under heavy usage. The margin floor is comfortable.

---

## Why per-facility (not per-user)

CLAUDE.md → "What Not to Build in MVP" already excludes per-user pricing. The reasoning:

1. **Frontline turnover is high.** Per-seat billing punishes customers for the exact thing the product is supposed to handle — onboarding new workers fast.
2. **Buyers think in facilities.** Warehouse budgets are organized by location. A per-site line item is approvable; a headcount forecast is a committee meeting.
3. **Comp set:** Beekeeper at $5–10 / employee / mo means a 50-person warehouse pays $250–500 / mo. OpsFluency at $79 / facility wins on price for any site with more than ~10 workers.
4. **Anti-feature:** counting workers creates an incentive to under-invite, which kneecaps adoption.

---

## Why no SOP or revision metering

Three reasons to keep "unlimited SOPs, unlimited revisions" in every tier:

1. **Math says you can.** Even a Scale customer re-translating their entire 150-SOP library every month costs ~$30 against $199 revenue — still 85% gross margin.
2. **Revisions are safety-critical.** If a forklift procedure changes, a manager must push the updated Spanish version immediately. A revision cap is a liability on the factory floor.
3. **You want them uploading.** Every published SOP is more lock-in, more renewal stickiness, more realized value. Don't put a meter on the behavior you want to encourage.

**The real upsell trigger is employee count, not activity.** A Starter customer actively managing 30 SOPs is growing and will naturally hit the 50-employee ceiling. Let the tier structure do the work.

---

## Pages/month budget at each tier

At $0.04/page, how much translation capacity does each subscription support before hitting a margin threshold:

| Tier | Revenue | 80% margin budget | 75% margin budget |
|---|---|---|---|
| Starter | $79 | 395 pages/mo | 494 pages/mo |
| Growth | $119 | 595 pages/mo | 744 pages/mo |
| Scale | $199 | 995 pages/mo | 1,244 pages/mo |

Typical monthly usage runs 50–150 pages/month per tenant. Budget headroom is 7–20× actual usage at every tier.

---

## Cost lines to actually watch

In rough order of likelihood that they'll bite first.

### 1. Anthropic spend cap *(do this now)*

Set a hard monthly limit in the Anthropic console. **$200/mo is plenty of headroom for the first 6 months of customers.** A bug or bad actor that runs unchecked AI calls is the only realistic path to a ruinous bill.

### 2. Per-tenant Google translation spike detection

The AI usage tab (`/dashboard/platform?tab=ai`) shows per-tenant Google cost. Flag any tenant whose Google column jumps more than 2× month-over-month — this signals bulk activity outside normal SOP management (e.g. someone using the pipeline as a generic translation service). The delete-history action on the platform console is the first-response tool for investigating these cases.

### 3. Per-tenant rate limits *(add when paying customers exist)*

`createSopFromUpload` should rate-limit per tenant. Suggested initial caps:

- 100 conversions per hour
- 200 conversions per day

Surfaces in the platform console as a soft alert at 50/day per tenant, hard refusal at the cap with a "fair use" message.

### 4. Storage growth

Every SOP retains the original PDF + every `sop_versions` row. At 5MB average × 500 SOPs × 100 tenants = ~250GB. Supabase Storage is **~$0.021 / GB / mo** = $5/mo total. Fine for MVP.

### 5. Vercel function-seconds

SOP conversions hold a serverless function open for up to 180s (the hard timeout per call). Measured avg is ~70s on Sonnet. At 1,000 conversions/mo × 70s avg = 70,000 function-seconds, well inside Vercel Pro's included quota.

---

## Optimization levers

| Lever | Savings | Quality risk | Status |
|---|---|---|---|
| **Haiku for Markdown conversion** (Call 1 of 2) | ~27% total cost reduction | Real — complex tables, implied warnings, scanned PDFs. Managers would need to proof conversion output. Not worth it for safety-critical documents. | ❌ **Evaluated and rejected** — Sonnet used for both calls; quality floor > cost savings |
| **Prompt caching** on system prompts | Cache reads at $0.30/M vs $3.00/M regular input (10× cheaper); meaningful savings when a manager uploads multiple SOPs in one session | None | ✅ **Shipped** (PR #135) — cache write/read tokens now tracked separately in `ai_call_log` |
| **Pre-extract text from digital PDFs** — skip vision when PDF has a text layer | 5–10× cheaper Haiku input on text-layer PDFs (most Word→PDF exports) | Modest — loses some table/diagram fidelity. A/B on real SOPs first | Not started |
| **Google Translation v3 + registered glossary** | Eliminates placeholder-substitution workaround; potentially better term consistency | Low | Not started — worth revisiting when glossary size grows |

---

## When to revisit metering

Two triggers, either of which earns a fresh look:

1. **A real tenant's AI spend exceeds 20% of their subscription price.** At Growth ($119) that's $23.80/mo, requiring ~595 pages/month — well above any normal usage profile. At Scale ($199) it's $39.80/mo (~995 pages).
2. **A Phase-2 feature lands that is genuinely AI-heavy and consumption-driven** (e.g. on-demand voice translation, real-time worker chat translation). That feature earns its own usage-based add-on rather than retrofitting metering onto SOPs.

---

## Explicitly out of scope for MVP pricing

- Per-user / per-seat pricing tiers
- Per-SOP overage billing
- Per-revision caps or limits of any kind
- Per-language pricing (Spanish is included; Phase 2 langs earn their own SKU)
- Custom onboarding fees on Starter (Enterprise only)
- Annual prepay discounts before there are 10 paying customers

---

## Reference: where the numbers come from

| Source | What it gives us |
|---|---|
| `ai_call_log` (Supabase) | Actual measured tokens + characters + duration per call. Per-tenant rollups on `/dashboard/platform?tab=ai` read from this table directly. |
| Cold Storage Pro live upload | 2 × five-page PDFs through full pipeline = $0.5523 total ($0.2171 Anthropic + $0.3352 Google). Ground truth for per-page estimates. |
| [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing) | Haiku 4.5: $1.00/$5 per M tokens (cached: $0.10/M). Sonnet 4.6: $3/$15 per M tokens (cached: $0.30/M). Verified April 2026. |
| [Google Cloud Translation pricing](https://cloud.google.com/translate/pricing) | $20 / M source characters for v2 standard. Verified April 2026. Note: the 500k char/month free tier applies to the API key (platform-wide), not per tenant — treat all translation as billable. |
| Vercel + Supabase dashboards | Monthly bill for serverless + storage. |

When any of these change, update the projections table and the lever table — don't paper over a pricing-model decision with stale cost data.
