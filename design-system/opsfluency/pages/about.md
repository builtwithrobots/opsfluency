<!-- v1.0.0 -->
# About — page override

> Deviations from `design-system/opsfluency/MASTER.md` only.

## Layout

- Entire page uses the narrow container (`max-w-2xl`). This is stricter than MASTER's "narrow" variant and applies to every section on this page.
- No cards, no feature grids. The only visual breaks are pull quotes.
- Prose uses `leading-relaxed` and `text-lg` (one step larger than body default) to improve long-form readability.

## Sections (in order)

1. Hero (eyebrow "About", h1, subhead)
2. FounderStory — long-form prose with three pull-quote beats
3. Insight — standalone callout with the thesis statement
4. Mission — three-part list
5. Roadmap — short view: MVP now, Phase 2 next
6. Final CTA — `CTABlock` linking to `/contact`

## Deviations from MASTER

- Pull quotes are oversized beyond MASTER §2: `text-3xl md:text-4xl` Chakra Petch weight 500, 2px left border in `--color-brand`, italicized, `leading-snug`. Used three times in FounderStory.
- Insight section uses a full-width teal-tinted callout: `bg-[color-mix(in_srgb,var(--color-brand-50)_60%,transparent)]` in light mode and `bg-[color-mix(in_srgb,var(--color-brand-dim)_15%,transparent)]` in dark. These color-mix values are the only deviation from the token set and exist solely here.

No typography or motion-timing deviations otherwise.
