# Theme scope: re-derive color scales on preset and opt-in containers

Graffiti's derived color scales — `--primary-1..9`, `--error-1..9`, `--fg-1..9` — are declared on `:root` as `oklch(from var(--primary) l c h / N)` expressions. The browser computes those expressions at `:root` and inherits the resolved colors. Overriding `--primary` on a descendant element therefore does **not** re-shade `--primary-1..9` on that descendant; the descendant inherits the original `:root`-computed scale. This is well-formed CSS, but it directly limits the "apply on any container" promise made by [ADR-0003](./0003-aesthetic-preset-architecture.md): a preset class on a `<section>` can change `--primary` but leaves every tinted derivative stale.

To close this hole, `drop-in.css` declares a single re-derivation block keyed on the `theme-` class-name fragment, plus a direct re-declaration of `--fg` so `--fg-light`/`--fg-dark` overrides on a scope propagate through `light-dark()`:

```css
:where([class*="theme-"]) {
  --fg: light-dark(var(--fg-light), var(--fg-dark));
  --fg-1: oklch(from var(--fg) l c h / 0.1);
  /* … --fg-2..9, --primary-1..9, --error-1..9 */
}
```

The `:where()` zero-specificity wrapper keeps the rule from outranking consumer overrides. The block lives in the core layer so the contract is stable whether or not the preset bundle is imported. The attribute selector matches any class containing `theme-` — including the bare `.theme-scope` marker, every named preset (`.theme-brutalist`, `.theme-editorial`, …), and any consumer-authored `.theme-*` class — so the catalog can grow without touching `drop-in.css`. Consumers wanting an ad-hoc scoped recolor without a full preset apply `.theme-scope` directly:

```html
<section class="theme-scope" style="--primary: gold">
  <!-- --primary-1..9 inside here re-shade to gold -->
</section>
```

## Considered options

- Register `--primary`/`--primary-N` with `@property` and rely on re-resolution. Rejected because `@property` controls typing, inheritance, and animation — it does not re-evaluate `oklch(from var(--X) ...)` expressions on the cascade. The rule still applies only where its selector matches.
- Rewrite the four framework consumption sites of `--primary-1..2` (and the zero sites of `--error-1..9`) with `color-mix(in oklab, var(--primary), transparent N%)` at the use site, and document `--primary-N` tokens as `:root`-stable only. Rejected: leaves a two-tier surface where `--primary-3` works for some consumers and silently misshades for others, exactly the leaky abstraction the system-integrity stance forbids.
- Re-declare derived scales on `:where(*)` so every element re-evaluates. Rejected: real performance cost (twenty-seven custom properties × every element), and a global rule on `*` for custom properties has surprising interactions with paint, animation, and registered properties. Maximalist beyond the actual surface.
- Enumerated allowlist — `:where(.theme-scope, .theme-brutalist, .theme-editorial, …)` listing every preset by name. Rejected: every new preset has to touch `drop-in.css` to be a real theme scope, and forgetting that step is a silent, scattered footgun. Consumer-authored scopes have no path at all without adding their class to the core list.
- Closed allowlist — re-derive only on the named preset classes, no `.theme-scope` utility. Rejected: forces any consumer who wants a scoped recolor to author a full preset (or accept stale scales), penalising the smallest legitimate use case.
- Drop the derived scales entirely and require all consumers to use `color-mix` at the use site. Rejected as a breaking change disproportionate to the problem; the precomputed scale is a useful token surface at `:root` scope, which covers the majority of consumption.

## Consequences

- Aesthetic presets ([ADR-0003](./0003-aesthetic-preset-architecture.md)) deliver on the "apply on any container" promise. A preset on a `<section>` re-shades its full alpha scale.
- `.theme-scope` enters the glossary as a first-class concept, distinct from layout primitives and from aesthetic presets. It is the smallest opt-in surface for container-scoped recolors.
- The re-derivation selector is open-ended: any class containing the `theme-` fragment qualifies. Catalog growth (new presets, consumer-authored scopes) requires no change to `drop-in.css`. The naming convention itself is the contract.
- Trade-off: a non-Graffiti class that happens to contain `theme-` (for example `.my-theme-toggle` on a UI control) also receives the re-declared block. The cost is the extra computed custom properties on those elements; since none of the underlying tokens are typically overridden there, the resolved values are identical to what the element would inherit from `:root`, and nothing renders differently. The naming overlap is judged rare enough — and the failure mode benign enough — to keep the open selector.
- Residual limitation, accepted by design: re-derivation fires once on the scope element. A descendant that further overrides `--primary` inside a theme scope still inherits the scope's derived scale; its own `--primary` change does not re-shade. The realistic frequency of nested overrides is near zero, and the alternative (`:where(*)`) was rejected. If a real use case surfaces, the consumer applies a nested `.theme-scope` on the inner element.
- `--fg` is re-declared inside the block alongside `--fg-1..9`. Without re-declaring `--fg` itself, a scope that overrides only `--fg-light`/`--fg-dark` would still inherit the `:root`-substituted `--fg` and the alpha scale would stay stale; re-declaring `--fg` here as `light-dark(var(--fg-light), var(--fg-dark))` makes both the base token and its alpha derivatives react to either form of override on the scope. The dominant light/dark case continues to work via `color-scheme` and `light-dark()` resolution semantics, unchanged.
- When the opaque color scale ships ([ADR-0007](./0007-opaque-color-scale.md)), `--{base}-opaque-1..9` joins this re-derivation block alongside the alpha scale. The block stays a single rule with the same selector; only the property count grows.
- The `graffiti-best-practices` skill gains a one-line rule: "to recolor a subtree, apply `.theme-scope` (or any `theme-*` class) on the container — not just an inline `--primary` override."
