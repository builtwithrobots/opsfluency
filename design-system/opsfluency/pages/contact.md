<!-- v1.0.0 -->
# Contact — page override

> Deviations from `design-system/opsfluency/MASTER.md` only.

## Layout

- Narrow container (`max-w-4xl`) for the hero; narrower (`max-w-2xl`) for the form and direct-channel cards.

## Sections (in order)

1. Hero (eyebrow "Contact", h1, subhead)
2. ContactForm — name, work email, company, employee-count select, message
3. DirectChannels — two cards side by side: email link, LinkedIn link
4. Faq — three short questions

## Deviations from MASTER

None. All components use MASTER tokens, MASTER form rules, and MASTER motion primitives as-is.

## Implementation notes

- Form POSTs to `/api/contact`. API route is a stub for MVP: logs to console, returns 200 with `{ ok: true }`. No email delivery wired up.
- Form uses the MASTER input spec verbatim (16px font-size, `bg-dc-surface`, `border-dc-edge-2`, `focus-visible` ring). Inline validation on blur. Error message below the field, referenced via `aria-describedby`. Submit button goes into disabled + loading state during the `fetch`.
