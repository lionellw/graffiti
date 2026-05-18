# Layout vs. utility classification: responsive or child contract = layout

Graffiti applies a single rule to decide whether a class belongs in `@layer layouts` or `@layer utilities`:

- **A class is a layout primitive** if it has *responsive collapse behavior* (a `@container` or `@media` query that reshapes the class itself) **or** *explicit child contracts* (selectors like `> *` that style direct children).
- **A class is a utility** if it toggles one or a tightly coupled pair of properties on the element itself, with no responsive behavior of its own and no child rules.

Applying this rule changes two classifications from the historical placement:

- `.split` moves from `@layer utilities` to `@layer layouts`. It has a `@container (max-width: 500px)` rule that collapses its flex direction, plus child rules. Its responsive behavior is exactly what [ADR-0002](./0002-cascade-layer-order.md) protects when it says "layout primitives are outermost frames whose responsive behavior must not be defeated by atomic utility classes."
- `.cluster` moves from `@layer layouts` to `@layer utilities`. It is a single concept (`display: flex; flex-wrap: wrap; align-items: center`) with one `.center` modifier. It has no responsive collapse, no child contract, and never needed the layout layer's cascade priority.

Everything else stays where it already was: `.flex` and `.grid` remain utilities (display toggle plus gap, no contracts); `.stack`, `.carousel`, `.reel` remain layouts (each has child rules and/or structural overflow/scroll-snap behavior); the `.layout-*` family remain layouts unconditionally.

## Considered options

- **Doc-only fix, `.cluster` stays a layout.** Rewrite the flagged ambiguity in CONTEXT.md to remove the `.cluster`-is-a-utility claim and leave the code unchanged. Rejected: leaves the `.split`-has-responsive-but-classified-utility gap unresolved, which is the more architecturally meaningful contradiction. Resolves a typo, not the underlying principle.
- **Doc-only fix, `.cluster` becomes a utility.** Move `.cluster` to utilities, leave `.split` in utilities. Rejected for the same reason: still doesn't address `.split`. Picking the smaller of two needed changes is worse than picking both.
- **Move every flex/grid-display class to layouts.** Treat any class that affects layout as a layout primitive. Rejected: `.flex` and `.grid` are genuinely atomic — no child contract, no responsive behavior — and promoting them would defeat the whole point of having a utility layer. The utility category should retain at least the atomic display toggles or it ceases to mean anything.
- **Introduce a third intermediate layer ("primitives" between utilities and layouts).** Rejected: more layers compound the cognitive cost of [ADR-0002](./0002-cascade-layer-order.md) without solving anything two layers can't. The rule "responsive or child contract = layout" is sharp enough that a third bucket is not needed.

## Consequences

- The cascade order from [ADR-0002](./0002-cascade-layer-order.md) (`base, components, utilities, layouts`) now has a clear inhabitancy rule. Future contributors adding a class can decide its layer from the class's own definition rather than from precedent.
- `.split` gains layout-layer priority. A `.split` used inside a `.layout-sidebar` is still overridden by `.layout-sidebar`'s structural rules (both are in the same layer; specificity wins), but a `.flex` applied alongside a `.split` no longer beats `.split`'s responsive collapse via cascade-layer order.
- `.cluster` loses layout-layer priority. If a consumer has nested a `.cluster` inside a `.layout-*` and was relying on `.cluster` winning a property conflict, the layout primitive now wins. This is the intended direction: structural frames trump wrapping helpers. The realistic blast radius is small — `.cluster` only sets three properties and a `.center` modifier; meaningful conflicts are unlikely.
- CONTEXT.md is updated: `.cluster` removed from the layout primitive examples and added to utility examples; `.split` added to layout primitive examples and removed from utility examples; the flagged ambiguity entry is rewritten to express the rule rather than enumerate exceptions.
- The `graffiti-best-practices` skill gains a one-line authoring rule: when introducing a new class, declare its layer using the responsive-or-child-contract test, not by analogy to nearby classes.
- The rule generalises forward. New `.layout-*` classes are by definition layouts. New small wrappers like `.cluster` belong in utilities. Anything in between — a class that needs a media query or wants to style its children — gets layout-layer priority and the rule is the documentation.
