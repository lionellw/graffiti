# Motion and z-index: semantic token scales

Graffiti adds two new semantic token scales: a five-step **duration scale** (`--d-instant`, `--d-fast`, `--d-base`, `--d-slow`, `--d-emphatic`) and a six-step **z-index scale** (`--z-base`, `--z-raised`, `--z-overlay`, `--z-sticky`, `--z-modal`, `--z-toast`). The existing easing tokens (`--ease-smooth`, `--ease-bounce`, `--ease-emphasized`) stay as-is — easing was already systematised. Component-internal `transition:` declarations and `z-index:` declarations in `drop-in.css` are refactored to consume the new tokens; hardcoded numeric values are out of bounds going forward.

```css
:root {
  --d-instant: 0.1s;    /* micro-feedback */
  --d-fast: 0.15s;      /* hover, focus, color */
  --d-base: 0.2s;       /* default */
  --d-slow: 0.3s;       /* layout shifts, panels, drawers */
  --d-emphatic: 0.4s;   /* dialog open, route transitions */

  --z-base: 0;
  --z-raised: 1;        /* card hover, focused row */
  --z-overlay: 10;      /* dropdown, popover, tooltip */
  --z-sticky: 100;      /* sticky header, sticky toolbar */
  --z-modal: 200;       /* dialog, drawer */
  --z-toast: 300;       /* toast, snackbar */
}
```

The values codify what `drop-in.css` was already doing in scattered places (0.1/0.15/0.2/0.3/0.4 seconds, and 0/1/2/10/100/200 z-indices) — this ADR does not invent a new motion language, it names the one already in use.

The duration scale unblocks motion presets, which were deliberately deferred from [ADR-0003](./0003-aesthetic-preset-architecture.md) pending this thread. A preset like `.theme-neon-arcade` can now declare `--d-base: 0.1s; --d-slow: 0.18s;` and every transition in the framework follows; without the scale, the same effect would require every preset to redeclare every `transition` declaration in the framework.

The z-index scale codifies a stacking-tier vocabulary that prevents the "modal appears behind toast" bug class. Consumers picking ad-hoc z-index integers cannot guess that `200` is the modal tier; the tokens make the contract legible.

## Considered options

- **Keep everything ad-hoc**. Rejected. Motion presets stay blocked, z-index magic numbers persist, and consumer code has no canonical place to look for "what duration goes with a hover transition?"
- **Numbered scales** (`--d-1..5`, `--z-1..5`). Rejected — generic numbering on the duration axis is acceptable but loses meaning ("which one is hover?"); on the z-index axis it would just rename the magic numbers without fixing the readability problem. Naming a token `--z-modal` is the entire point.
- **Material-style nested duration scale** (`motion-duration-short1..short4`, `motion-duration-medium1..2`, etc.). Rejected as too much surface for a five-step scale. Graffiti's existing one-word naming convention (`--pad-l`, `--br-m`) prefers flat semantic names.
- **Pixel-aware z-index registry** (every component declares its tier in a JS-readable manifest). Rejected as overkill for a framework whose entire surface is CSS variables; the tier names *are* the registry.
- **Ship duration only, defer z-index**. Rejected — z-index is independently load-bearing and the cost of shipping both together is negligible (eleven new tokens total).

## Consequences

- Hardcoded `0.1s` / `0.15s` / `0.2s` / `0.3s` / `0.4s` literals in `drop-in.css` get replaced with `var(--d-*)` references. Hardcoded `z-index: 0/1/2/10/100/200` integers get replaced with `var(--z-*)`. The refactor is mechanical and tracked under the motion-preset epic.
- Motion enters the official **theme axis** roster — no longer a "latent axis." A future motion-axis dropdown in `ThemeControls.svelte` is now token-shaped.
- Motion presets become a v2 follow-up for [ADR-0003](./0003-aesthetic-preset-architecture.md). A preset can now coordinate duration (snappy vs. languid) alongside its color and type choices, which was the original goal.
- Z-index tokens are intentionally **not** subject to theme-scope re-derivation. Presets do not override stacking tiers; the tier vocabulary is a framework contract, not an aesthetic dimension.
- New consumer-facing rule (added to the `graffiti-best-practices` skill): when authoring components or overriding framework styles, consume `var(--d-*)` and `var(--z-*)` rather than hardcoding numeric values. Hardcoded values in component code are now a lint-worthy smell.
- Duration values are intentionally `s`-suffixed rather than millisecond-suffixed to match the existing easing token style and avoid the `200ms` vs `0.2s` divergence within the same `transition` declaration.
