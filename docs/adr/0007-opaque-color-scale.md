# Opaque color scale: parallel to alpha, symmetric around full primary

Graffiti adds a parallel opaque color scale `--{base}-opaque-1..9` for every base that currently has an alpha scale (`--{base}-1..9`). The opaque scale is built with `color-mix(in oklab, …)` and is **symmetric**: step 1 is the lightest tint (max mix toward `--bg`), step 5 is the raw base color, step 9 is the darkest shade (max mix toward `--fg`). Steps 1–4 are tints; step 5 is the base; steps 6–9 are shades. This mirrors the Tailwind/Radix mental model rather than the monotonic alpha scale.

The motivating failure cases for an opaque counterpart are: photo and non-flat backdrops where alpha tints bleed through; stacked transparency where compounding alphas no longer mean "N% strength"; print fidelity where alpha resolves to paper; text contrast on tinted surfaces. The first three are tint-direction problems; the fourth is a shade-direction problem. A single symmetric scale covers both with one mental model.

The surface ships for every base that already has an alpha scale (17 static colors plus 6 derived semantic bases: `fg`, `bg`, `primary`, `error`, `warning`, `success`). That is 23 × 9 = ~207 new tokens. The width is a deliberate choice: ad-hoc opaque mixing inside framework or consumer code becomes a token reference rather than a fresh `color-mix` expression, and AI agents using the framework do not have to learn which bases are blessed for opaque use.

Step distribution (concrete percentages tuned during implementation, but the shape is fixed):

```css
:root {
  --primary-opaque-1: color-mix(in oklab, var(--primary), var(--bg) 90%);  /* lightest tint */
  --primary-opaque-2: color-mix(in oklab, var(--primary), var(--bg) 80%);
  --primary-opaque-3: color-mix(in oklab, var(--primary), var(--bg) 65%);
  --primary-opaque-4: color-mix(in oklab, var(--primary), var(--bg) 40%);
  --primary-opaque-5: var(--primary);                                       /* anchor */
  --primary-opaque-6: color-mix(in oklab, var(--primary), var(--fg) 30%);
  --primary-opaque-7: color-mix(in oklab, var(--primary), var(--fg) 50%);
  --primary-opaque-8: color-mix(in oklab, var(--primary), var(--fg) 70%);
  --primary-opaque-9: color-mix(in oklab, var(--primary), var(--fg) 90%);   /* darkest shade */
}
```

The opaque scale joins the alpha scale in the theme-scope re-derivation block defined by [ADR-0006](./0006-theme-scope-derived-scale-rederivation.md). For derived semantic bases, overriding the base on a theme scope re-derives the full opaque scale on that scope. For static bases (`--red`, `--blue`, etc.), the static color does not change, but `--bg`/`--fg` overrides inside a scope cause the static base's opaque scale to re-derive — so the re-derivation block re-declares every opaque scale, not just the derived-base ones.

## Considered options

- **Monotonic mirror** of the alpha scale (1 = faintest mix into bg, 9 = full primary; no shade direction). Rejected: covers only three of four named failure cases, leaves "darker than primary" as a separate concept requiring either a third parallel scale or ad-hoc named state tokens. The Tailwind/Radix ecosystem norm is symmetric, and a Graffiti consumer reaching for an opaque variant of `--primary-3` is more often asking "give me the equivalent at this step on a non-alpha axis" than "give me 30% strength mixed into bg."
- **Three parallel monotonic scales**: keep alpha at `--primary-1..9`, add monotonic tints at `--primary-tint-1..9`, add monotonic shades at `--primary-shade-1..9`. Rejected as too much surface — three numeric scales per base, each with its own meaning of `-3`. Doubling tokens once is acceptable; tripling is taste-failure.
- **Narrow base set** (only the 5 derived semantic bases). Rejected: leaves an asymmetry where `--primary-opaque-3` exists but `--red-opaque-3` does not. AI agents and consumers would have to learn the allowlist. Wide surface costs ~3KB gzipped; the consistency is worth it.
- **Radix `-a1..a9` naming** (`--primary-1..9` becomes opaque, `--primary-a1..a9` becomes alpha). Rejected as a breaking change to every existing consumer reference to `--primary-1..9`. The `-opaque-` suffix is verbose but unambiguous and additive.
- **Configurable mix endpoint via `--mix-bg`/`--mix-fg`**. Rejected for now: surfaces with their own bg can use `color-mix` directly at the use site without paying for a framework-wide indirection. May revisit if real demand surfaces.

## Consequences

- Token surface roughly doubles for color scales. The alpha scale (~207 tokens) and opaque scale (~207 tokens) coexist. The skill must distinguish them: alpha for transparent overlays/tints over arbitrary backdrops, opaque for surfaces that must block, print, or stack without compounding.
- The number `-3` no longer carries a single meaning across both scales: `--primary-3` (alpha) is 30% strength, while `--primary-opaque-3` is partway between bg and primary on the tint side. Skill documentation has to make the difference explicit so consumers do not assume they are drop-in equivalents.
- Step 5 of the opaque scale resolves to the raw base color (`var(--primary)`). The token is intentionally redundant with `var(--primary)` so consumers writing `--primary-opaque-N` patterns do not have a hole at the middle step.
- The theme-scope re-derivation block defined by [ADR-0006](./0006-theme-scope-derived-scale-rederivation.md) grows to include every `--{base}-opaque-1..9`. The block stays a single rule on `:where([class*="theme-"])`, so the performance footprint stays bounded to elements that opt in to scoped theming.
- The `graffiti-best-practices` skill gains explicit guidance: prefer the alpha scale when the design wants overlays or tinted glass on arbitrary backdrops; prefer the opaque scale when the design needs printable, photo-stable, or contrast-stable surfaces.
- A "shade-only" or "tint-only" scale is intentionally not shipped. If a consumer wants only one direction, they consume the relevant half of the symmetric opaque scale (1–4 for tints, 6–9 for shades).
