<!-- v1.0.0 -->
# Features — page override

> Deviations from `design-system/opsfluency/MASTER.md` only.

## Layout

- Hero is narrower than Home: `max-w-4xl` with centered text. No `.background` grid.
- Feature sections alternate two-column layouts: odd-indexed feature is image-left / text-right, even-indexed is text-left / image-right. On `<768px` both collapse to stacked with the visual on top.

## Sections (in order)

1. Hero (eyebrow "Features", h1, subhead)
2. SopImport — AI conversion from PDF, DOCX, TXT
3. Glossary — site-specific terms flagged once, reused forever
4. BilingualPublishing — English + Spanish, manager-approved
5. QrCodes — one permanent QR per SOP, print layout
6. WorkerPWA — offline-capable, magic-link auth
7. Monitors — TV pairing via QR
8. HrModule — SOPs plus contacts plus worker chat
9. ScanAnalytics — who viewed what, when, in which language
10. ManagerDashboard — full control surface
11. Final CTA — `CTABlock` linking to `/pricing`

## Deviations from MASTER

- Placeholder visuals for each feature are labeled as mockups. Every placeholder carries a small mono-font tag "Mockup" in the top-right corner tinted `text-dc-text-3`, and `alt` text begins with "Mockup:".
- Feature visuals use `bg-dc-raised` with a 1px `border-dc-edge` and interior teal geometric shapes. No gradients, no photography.

No color, typography, or motion-timing deviations.
