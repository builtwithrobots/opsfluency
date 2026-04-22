<!-- v1.0.0 -->
# Home — page override

> Deviations from `design-system/opsfluency/MASTER.md` only.
> Everything not listed here comes from MASTER.

## Layout

- Hero uses the `.background` utility (grid background) from `globals.css`. This is Home only.
- Container width follows MASTER default (`max-w-7xl`). Do not narrow the hero.

## Sections (in order)

1. Hero (eyebrow + h1 + subhead + primary CTA + secondary CTA)
2. Problem — three-stat row using MASTER stat-callout pattern
3. Solution — three-pillar feature grid
4. How it works — three-step preview, links to `/how-it-works`
5. Pricing teaser — four simplified tier cards, links to `/pricing`
6. Founder credibility — single pull quote using MASTER §2 pull-quote rule, links to `/about`
7. Final CTA — `CTABlock` primitive (teal gradient)

No testimonials carousel. Founder credibility is the trust signal for MVP.

## Deviations from MASTER

- Hero stat "17 hrs/week" wears `.animate-brand-glow` for emphasis. The other two stats in the row do not.
- Hero eyebrow gets a leading `.animate-heartbeat` dot in `--color-signal-live`. Other eyebrows on the page do not.
- Final CTA uses the full-bleed `section-loose` rhythm (`py-20 md:py-32`). Other sections use `section` default.

No color, typography, or motion-timing deviations.
