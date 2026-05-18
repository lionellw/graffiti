# Graffiti

Graffiti is a CSS theming and primitives package: design tokens, fluid typography, layout primitives, utilities, and component patterns. It is consumed both as an NPM import and as a CLI that copies `drop-in.css` into a project.

## Language

**Token**:
A CSS custom property declared on `:root` or another scoping element. Tokens carry meaning the framework or a consumer can override.
_Avoid_: variable, custom property (use these only when speaking strictly about the CSS feature, not Graffiti's design system).

**Literal token**:
A token whose value is a concrete primitive — a color, a length, a duration. Examples: `--blue`, `--pad-l`, `--vs-base`, `--lh-s`. Literals are the source colors and spacings the rest of the system composes from.

**Semantic token**:
A token whose value resolves through one or more literals to express *purpose*. Examples: `--primary`, `--accent`, `--focus-ring`, `--border-1`, `--shadow-2`. Semantic tokens are what components should consume; literals are what consumers may override at the root.

**Alpha scale**:
A nine-step color scale built by varying *alpha*, not lightness — e.g. `--blue-1` (10% alpha of `--blue`) through `--blue-9` (full opacity). Monotonic: 1 is faintest, 9 is full opacity. Designed for tints, overlays, and surfaces that should adapt to the underlying background and `color-scheme`. Pairs with the **opaque scale** for cases where alpha-on-background fails (photo backdrops, stacked transparency, print, contrast-stable text).
_Avoid_: lightness scale, opacity scale (`opacity` is a property; alpha is a channel — they're not the same).

**Opaque scale**:
A nine-step *symmetric* color scale built with `color-mix(in oklab, …)` rather than alpha — e.g. `--blue-opaque-1` (lightest tint, mixed toward `--bg`) through `--blue-opaque-9` (darkest shade, mixed toward `--fg`), with `--blue-opaque-5` = `var(--blue)` (the raw base). Ships for every base color that has an alpha scale. Use when a surface must block content underneath (photo backdrop), survive printing, or stack without compounding alphas; use the **alpha scale** when overlays should adapt to whatever is below. Step `-3` does *not* mean the same thing in the two scales — the alpha scale is monotonic strength, the opaque scale is symmetric around the base color. See [ADR-0007](./docs/adr/0007-opaque-color-scale.md).
_Avoid_: "lightness scale" (overloaded with the historical Tailwind v3 mental model where steps shift lightness without mixing).

**Layout primitive**:
A class in `@layer layouts` that establishes structural frame and responsive behavior. A class belongs in the layout layer if it has *responsive collapse behavior* (a `@container` or `@media` query that reshapes the class itself) **or** *explicit child contracts* (selectors like `> *` that style direct children). Examples: `.layout-sidebar`, `.layout-card`, `.layout-readable`, `.layout-holy-grail`, `.split`, `.stack`, `.carousel`, `.reel`. Layout primitives are the outermost shapes a page is built from; their breakpoint behavior is part of the contract. **Per-instance breakpoint overrides are intentionally not supported** — consumers needing different collapse thresholds compose with `@container` queries (wrap the layout in a `container-type: inline-size` parent of the desired size) or pick a different layout primitive. See [ADR-0009](./docs/adr/0009-layout-vs-utility-classification.md).

**Utility**:
A class in `@layer utilities` that toggles a single property or a tightly coupled pair, with no responsive behavior of its own and no child rules. Examples: `.flex`, `.grid`, `.cluster`, `.text-center`, `.full`, `.transition`, `.aspect-square`. Utilities are atomic and may be applied inside any layout, but cannot override a layout primitive's structural decisions (see [ADR-0002](./docs/adr/0002-cascade-layer-order.md), [ADR-0009](./docs/adr/0009-layout-vs-utility-classification.md)).

**Component**:
A class in `@layer components` that ships a finished visual pattern — surface, padding, border, motion. Examples: `.card`, `.feature-card`, `.stat-card`, `.toc`, `.newsletter`. Components consume semantic tokens; consumers customise components by overriding tokens, not by overriding component rules.

**Fluid level (`--fl`)**:
A scalar (typically `-1` through `6`) that selects a step on Graffiti's modular type scale. Setting `--fl: 3` on any element resizes its text to that step, scaled fluidly between viewport breakpoints.

**Theme axis**:
A single override dimension exposed for theming. Today's surfaced axes (see `src/docs/ThemeControls.svelte`) are: color palette, font family, type scale, and border-radius scale. Axes are orthogonal — a selection on one axis does not constrain selections on the others. **Motion** graduates to a first-class axis with the duration scale shipped in [ADR-0008](./docs/adr/0008-motion-and-zindex-scales.md); a motion-axis selector in `ThemeControls.svelte` is now token-shaped and follow-on work. Latent axes that exist as tokens but are not yet exposed as preset axes include shadow and density. **Z-index is intentionally not a theme axis** — stacking tiers are a framework contract, not an aesthetic dimension.
_Avoid_: "theme" used alone for these (ambiguous — the docs site currently calls the color-palette axis "Theme").

**Aesthetic preset**:
A *coordinated* override stack that couples multiple theme axes (color + type + radius + shadow + font family, plus optional typographic selector rules) to deliver a single recognisable visual personality — e.g. brutalist, editorial, soft-consumer, neon-arcade, paper. Distinguished from an axis selection by being non-orthogonal: an aesthetic preset commits a constellation of decisions together. The intended job of an aesthetic preset is to absorb taste-level decisions on behalf of a consumer (human or AI) so that "use Graffiti, walk away" produces a coherent look.
Aesthetic presets ship as CSS classes (`.theme-brutalist`, `.theme-editorial`, etc.) via an opt-in import path separate from `drop-in.css`, so consumers only pay bytes for the presets they choose to load. Their selector rules live in `@layer themes`, slotted between `base` and `components`, so a preset cannot accidentally restyle component internals. The same class can be applied at `:root`/`html` for app-wide effect or on any container element for scoped theming. See [ADR-0003](./docs/adr/0003-aesthetic-preset-architecture.md).
Graffiti does **not** ship algorithmic palette derivation (a single `--brand` seed expanded into `--accent`/`--secondary`/surface tints). Coherence is the job of a preset author committing a constellation of decisions, not the job of a complementary-hue formula. Consumers seeking brand coherence apply the closest-fitting preset and override `--primary` — the preset class is implicitly a **theme scope**, so the alpha scale follows the override and the rest of the preset's coordinated tokens survive.
_Avoid_: "theme preset" (collides with the current color-only "themes" in `ThemeControls.svelte`).

**Theme scope**:
A container element marked as a *re-derivation boundary* for Graffiti's derived color scales (`--primary-1..9`, `--error-1..9`, `--fg-1..9`). Applied via the `.theme-scope` utility class, or implicitly by any **aesthetic preset** class. Inside a theme scope, overriding `--primary`/`--error`/`--fg` causes the corresponding alpha scale to re-derive on that element, rather than inheriting the `:root`-computed scale. Outside a theme scope, those scales are `:root`-stable: overriding the base on a non-scope element changes only the base, not the derived steps. See [ADR-0006](./docs/adr/0006-theme-scope-derived-scale-rederivation.md).
_Avoid_: "theme container" (overlaps with **layout primitive** terminology).

## Relationships

- A **literal token** may feed one or more **semantic tokens** (`--blue` → `--primary`).
- A **component** consumes **semantic tokens**, never **literal tokens** directly.
- A **layout primitive** wins over a **utility** applied within it ([ADR-0002](./docs/adr/0002-cascade-layer-order.md)).
- `.layout-three-col` (equal-width columns) and `.layout-holy-grail` (centered readable content with optional `.rail-start` / `.rail-end` children, [ADR-0010](./docs/adr/0010-holy-grail-repurpose-as-rails-layout.md)) serve distinct intents — equal-width grids vs. editorial reading layouts. Pick by what the middle column should do.
- A **utility** wins over a **component** for atomic property toggles.
- `.auto-color` is a text-contrast-only utility — it sets `background-color` and a contrast-safe `color`, but does **not** set `--bg`, `--fg`, or propagate to derived scales (alpha or opaque). Use it for tags, chips, and badges with text-only content. For a fully coordinated colored surface (border, muted text, scaled tokens), apply `.theme-scope` and set `--bg`/`--fg` directly. Expanding `.auto-color` to do the bigger job was considered and rejected — system integrity prefers a small, clear utility over a quiet contract expansion.

## Flagged ambiguities

- ~~**"Alpha scale" vs a future "lightness scale"**~~ — *resolved by [ADR-0007](./docs/adr/0007-opaque-color-scale.md).* Graffiti now ships both an **alpha scale** (monotonic, `--{base}-1..9`) and an **opaque scale** (symmetric, `--{base}-opaque-1..9`). The `-opaque-` suffix is the disambiguator; we deliberately did *not* adopt Radix's `-a1..a9` alpha suffix because it would have been a breaking change to existing consumers.
- ~~**"Layout" historically overlapped with "utility"**~~ — *resolved by [ADR-0009](./docs/adr/0009-layout-vs-utility-classification.md).* The rule is now explicit: responsive collapse or explicit child contracts → layout layer; atomic single-property toggle → utility layer. `.split` moves to layouts (has `@container` collapse); `.cluster` moves to utilities (atomic). `.flex` and `.grid` stay utilities; `.stack`, `.carousel`, `.reel` stay layouts.
- **ThemeControls UX when a preset is selected**: with aesthetic presets landing as a higher-level concept above the orthogonal color / type-scale / radius / font-family axes ([ADR-0003](./docs/adr/0003-aesthetic-preset-architecture.md)), it is not yet decided whether selecting a preset in `ThemeControls.svelte` should lock the axis dropdowns, layer under them (axes override the preset), or hydrate them with the preset's axis values for further tweaking. This is a UX decision, not an architectural one — the underlying CSS class composition supports any of those flows.
