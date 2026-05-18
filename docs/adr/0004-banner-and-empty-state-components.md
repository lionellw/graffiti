# `.banner` and `.empty` for status messaging

Graffiti ships two new component classes for status messaging that the existing `.callout` cannot express:

- `.banner` — a full-bleed horizontal strip (cookie consent, impersonation notice, site-wide announcement) with three logical slots: icon, text, actions. Color variants reuse the existing `--callout-color` / `--callout-border-color` tokens (`warning`, `error`, `success`, `ghost`). A `.banner.sticky` modifier handles top-of-viewport pinning.
- `.empty` — a centered vertical-stack pattern for no-content states (empty lists, no search results, fresh dashboards). Slots in source order: icon/illustration, headline, body text, action(s). `max-inline-size` constraint (~48ch) keeps body text comfortable; padding is `--empty-pad` (default `--pad-xxxl`) so it can tighten inside cards.

Both consume semantic tokens already in the system; neither introduces new color literals.

## Considered options

- **Extend `.callout` with a `.banner` modifier.** Rejected — `.callout` is card-shaped (border-radius, contained padding); a banner is structurally edge-to-edge. Conflating them would strain the `.callout` API.
- **Treat empty state as a layout primitive (`.layout-empty`).** Rejected — empty state most often appears *inside* a card or list region, not as a route-level frame. A component fits the actual usage better than a layout.
- **Compose empty state from `.stack` + utilities ad-hoc.** Rejected — every list view in every app needs this pattern; the per-app drift it produces is exactly what a finished pattern is for.

## The intentional no-dismiss decision

`.banner` ships **no built-in dismiss mechanism**, even though every comparable component library (Bootstrap, Material, Tailwind UI, Carbon) does. The reasoning:

- A popover-driven dismiss (`<aside popover>` + `popovertarget`) sounds right but doesn't solve the default-visible case, because `[popover]` elements are hidden until invoked, and there's no HTML-only way to open a popover at load.
- A `<dialog open>` + `<form method="dialog">` pattern works but pulls dialog semantics into what's structurally just a strip.
- A checkbox + `:has(:checked) { display: none }` hack works but is CSS-state that doesn't persist across reloads.
- Real-world dismissible banners (cookie consent, impersonation) need persistence (localStorage, cookies, server) which is JS territory anyway.

So Graffiti styles the shape; consumers wire dismiss + persistence themselves, or reach for Decks. Authors who want dismiss add a button and their own JS — Graffiti doesn't pretend to solve the persistence half of the problem.

## Consequences

- `.banner` and `.empty` live in `@layer components`.
- Neither introduces new color tokens; both compose on the existing semantic palette.
- The reduced-motion contract from [ADR 0001](./0001-reduced-motion-animation-property.md) applies — if either gains transitions (e.g., `.banner.sticky` slide-down), an `--animation-reduced` value is required.
- The "no JS dismiss" decision keeps `.banner`'s scope tight; authors needing dismiss + persistence aren't getting half a solution, they're getting none, and the seam where their code begins is explicit.
