<!-- v1.0.0 -->
# Pricing — page override

> Deviations from `design-system/opsfluency/MASTER.md` only.

## Layout

- Hero narrower than Home: `max-w-4xl` with centered text.
- Four tier cards in a single row on `lg`, two-by-two on `md`, horizontally snap-scrollable on `<768px`.
- Comparison table collapses to per-tier cards on `<768px` (not a horizontal scroll — too painful on mobile).

## Sections (in order)

1. Hero (eyebrow "Pricing", h1, subhead)
2. BillingToggle — annual / month-to-month
3. TierGrid — Starter, Growth, Scale, Enterprise (four cards)
4. ComparisonTable — full feature matrix
5. ExpenseCallout — "Can I expense this without approval?"
6. Faq — accordion, 6–8 questions
7. Final CTA — `CTABlock` ("Start a 14-day free trial. No credit card required.")

## Deviations from MASTER

- **Growth tier** is emphasized: wears `.animate-brand-glow`, carries a "Most popular" ribbon in `--color-brand` at top-right, and the card uses `bg-dc-raised` instead of `bg-dc-surface`.
- Annual/monthly toggle uses Framer Motion `layout` animation on the price numerals so the value swaps in place without jump. Duration 300ms, `easeOut`. This is the one place `layout` animation is allowed.
- Comparison table sticky header row uses `bg-dc-overlay` and a bottom `border-dc-edge-2`.
- FAQ accordion is the Radix pattern (already supported by CSS keyframes in `globals.css` at `[data-state=open] > [data-radix-accordion-content]`).

No color or typography deviations.
