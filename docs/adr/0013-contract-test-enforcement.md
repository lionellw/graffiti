# Contract tests enforce the public surface and the reduced-motion contract

Graffiti's [`tests/contracts/`](../../tests/contracts) suite, run by [`vitest.contracts.config.ts`](../../vitest.contracts.config.ts), is the framework's automated guardrail for the **public surface** defined in [ADR-0011](./0011-public-surface-and-deprecation-policy.md) and the **reduced-motion contract** defined in [ADR-0001](./0001-reduced-motion-animation-property.md). The suite expands beyond its current coverage (critical tokens, critical selectors, `!important` budgets, no-ID-selectors) to encompass everything the framework promises consumers, and adds a strict reduced-motion rule.

## Public-surface coverage

Each ADR that adds, removes, or changes a public-surface item also ships a matching contract test. Concretely the suite gains:

- **Cascade layer order.** Asserts the `@layer base, themes, components, utilities, layouts;` declaration is intact in the bundled CSS. Reordering the layer declaration is a high-impact breaking change ([ADR-0002](./0002-cascade-layer-order.md)); a test catches it before it ships.
- **Layer assignment of named classes.** Each class explicitly named in an ADR (currently `.split` in layouts and `.cluster` in utilities per [ADR-0009](./0009-layout-vs-utility-classification.md), and the layout primitives `.stack`/`.carousel`/`.reel` already covered by the existing suite) gets a layer-presence assertion.
- **New token surfaces.** The duration scale (`--d-instant`/`fast`/`base`/`slow`/`emphatic`) and z-index tier scale (`--z-base`/`raised`/`overlay`/`sticky`/`modal`/`toast`) from [ADR-0008](./0008-motion-and-zindex-scales.md), and the opaque scale (`--{base}-opaque-1..9`) from [ADR-0007](./0007-opaque-color-scale.md), get presence assertions when implemented.
- **Theme-scope re-derivation block.** The `:where(.theme-scope, .theme-brutalist, …)` rule defined by [ADR-0006](./0006-theme-scope-derived-scale-rederivation.md) is asserted to exist; the test fails if a preset is added to the selector list without being also added to the test fixture.

## Reduced-motion enforcement

The suite gains a strict rule: **any CSS rule containing `animation:` must also declare `--animation-reduced`**. The declaration can be `--animation-reduced: none;` (the explicit "stop" decision) or a reduced variant (e.g. `--animation-reduced: spin 20s infinite linear;`). The presence of the declaration *is* the deliberation. Components that omit it fail CI.

A spinner that uses `animation: spin 1s linear infinite;` without an `--animation-reduced` value would, under reduced motion, stop entirely and disappear visually — almost never the intended outcome. ADR-0001 already says this MUST be considered; the new test makes the consideration enforceable rather than aspirational.

## Considered options

- **Allowlist of components that intentionally stop under reduced motion.** Rejected: splits the deliberation across two files (the CSS rule and the allowlist), and allowlists tend to grow until they lose their signal. The CSS declaration itself is the better contract.
- **Soft warning, not a CI failure.** Rejected: in a small framework with a small team, an unenforced warning gets ignored. The whole reason this thread exists is that ADR-0001's MUST-consider is being forgotten.
- **No automated test; rely on PR review.** Rejected — that is the status quo Thread 2 of the meta-system grill is complaining about. Honor-system doesn't scale across releases.
- **Test each ADR's surface in a separate test file.** Rejected: the contract test directory stays flat. The existing `tokens-and-selectors.test.ts` already groups by concern (tokens, selectors, !important budgets, id-selector ban); new concerns get new `describe` blocks in the same file or sibling files. No separate per-ADR file proliferation.
- **Snapshot the entire CSS bundle.** Rejected as too brittle: a snapshot test would fail on every non-breaking change (a new utility, a new component), forcing a snapshot update for every PR. Targeted assertions on the public surface catch what matters without false positives.

## Consequences

- Every future ADR that touches the public surface or the reduced-motion contract includes a "tests added" line specifying which assertion lands with the change. ADRs that don't touch the surface don't need new tests.
- The existing test for `.split` in `utilities` ([tests/contracts/tokens-and-selectors.test.ts:26](../../tests/contracts/tokens-and-selectors.test.ts)) is updated alongside ADR-0009's implementation: `.split` moves to the layouts assertion list; `.cluster` moves to the utilities assertion list.
- New animated components that ship without `--animation-reduced` cannot pass CI. The contract test refusing to merge is the deliberation gate.
- The contract suite is not a complete spec — it asserts known guarantees, not the entire bundle. Bugs in non-asserted behavior are still bugs, and discovery may trigger a new assertion alongside the fix.
- The skill's authoring guidance gains a one-line rule: when authoring an animated component, declare `--animation-reduced` (set to `none` for stop, or a reduced variant for continuous animations like spinners and progress).
- This ADR satisfies meta-system grill Thread 2 (reduced-motion enforcement) and Thread 3 (no contract tests for tokens or cascade layers).
