<!-- v1.0.0 -->
# How It Works — page override

> Deviations from `design-system/opsfluency/MASTER.md` only.

## Layout

- Hero narrower than Home: `max-w-4xl` with centered text.
- Two-column flow (Manager / Worker) sits side by side at `lg`, stacked on `<1024px`. Columns are equal width and use a 1px vertical divider in `dc-edge` at `lg`.
- Each step in a column is a row: oversized numeral on the left, title + description on the right.

## Sections (in order)

1. Hero (eyebrow "How It Works", h1, subhead)
2. TwoColumnFlow — ManagerColumn (7 steps) and WorkerColumn (6 steps)
3. UnderTheHood — compact tech-stack grid, 5 cards (Sonnet, Google Translate, Clerk, Supabase, Vercel)
4. Timeline — "Upload to mounted QR in under 15 minutes"
5. Final CTA — `CTABlock`

## Deviations from MASTER

- Step numerals are oversized: `text-7xl md:text-8xl` in Chakra Petch, color `--color-brand` at 40 percent opacity. This is larger than MASTER's stat-callout rule and is specific to this page.
- The vertical divider between columns animates in on scroll: `scaleY(0)` to `scaleY(1)` over 500ms `easeOut`. Origin-top. Only animates once.
- Tech-stack card grid uses `grid-cols-2 md:grid-cols-5` (5 across on desktop). MASTER does not specify a 5-column grid anywhere else.

No color or typography deviations.
