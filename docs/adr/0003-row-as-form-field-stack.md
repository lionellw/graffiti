# `.row` is the form-field stack

`.row` is being generalised from a vertical-spacing utility into the canonical labeled-field container — a stack that groups a label (or `<legend>`), an optional hint, an input/select/textarea/fieldset, and an `<output>` for error messaging. The class name is kept (despite "row" being an awkward word for a vertical stack) because consumers already use it and renaming costs more than the semantic mismatch does. The form-field behaviour fires via `:has()` on form children rather than via a `<form>`/`<fieldset>` ancestor, so the same pattern works inside cards, settings panels, and other non-`<form>` contexts.

## Contract

```html
<div class="row">
  <label for="email">Email</label>
  <small>We'll never share this.</small>
  <input id="email" type="email" required />
  <output for="email">Must be a valid email address.</output>
</div>
```

- **Trigger**: `.row:has(> :is(label, legend, fieldset, input, select, textarea))` activates the field-stack grid. A `.row` containing only prose remains a vertical-margin utility.
- **Visual order matches source order**: `label → hint (<small>) → input → error (<output>)`.
- **Hint**: any `<small>` direct child. No class required.
- **Error**: `<output>` element, `display: none` in steady state. Revealed by `.row:has(:user-invalid) > output`. Authors keep the message text in markup so screen readers and progressive enhancement work without JS.
- **Required**: `.row:has(> :required) > :is(label, legend)::after { content: "*"; }` — no author markup beyond the `required` attribute.
- **Option groups**: `<fieldset class="row">` with `<legend>` as label and `.form-option-row` children for each checkbox/radio. The `:has()` trigger fires on `<legend>`/`<fieldset>` so option groups get the same stack treatment.
- **Invalid styling**: input border (existing `:user-invalid` rule), plus label/legend tint, plus output reveal — three coordinated signals.
- **Disabled**: `.row:has(:disabled)` mutes label and hint.

## Modifiers

- `.row.horizontal` — label on the left, input on the right. Two-column grid for settings panels and dialogs.
- `.row.compact` — tightens `--row-gap` and font sizing for dense forms.

## Considered options

- **Ship a new `.field` class**, leaving `.row` alone. Rejected because the existing `.row` already does ~80% of this job inside `<form>`; adding `.field` doubles the vocabulary without removing the overload.
- **Rename `.row` → `.field-stack` / `.form-row`.** Rejected on migration cost; the row-as-vertical-stack name mismatch is documented here instead of carried as a long-term rename.
- **One slot for both hint and error**, swapping on `:user-invalid`. Rejected because a permanent hint and a transient error are different communications and authors should be able to ship both.
- **`role="alert"` on `<small>` for errors.** Rejected in favour of `<output>` because `<output>` is the standards-correct element for a form result, gets live-region behaviour for free, and pairs natively with `<input>` via the `for` attribute.
- **`.row.horizontal` via container query auto-flip.** Rejected because magic responsiveness without an explicit modifier is unpredictable in narrow embeds and dialogs.
- **Keep the `<form>`/`<fieldset>` ancestor gate.** Rejected because settings panels and inline forms without a `<form>` element are common and the gate forces authors to add semantically wrong wrappers.

## Consequences

- `.row` moves from `@layer utilities` to `@layer components` per the existing CONTEXT.md definitions — it now ships a finished visual pattern with internal grid, multiple `:has()` states, and modifiers, which exceeds the "single property or tightly coupled pair" bar for utilities.
- Authors must write `<output>` in markup for every field that wants an error slot, even when the message is dynamic. The `display: none` default keeps it invisible until `:user-invalid` fires, so steady-state layout is unchanged.
- Existing consumer code that relies on `.row` purely for `margin-block` inside non-form contexts continues to work — the field-stack grid only activates when form children are present.
- The reduced-motion contract from [ADR 0001](./0001-reduced-motion-animation-property.md) applies: if any transitions are added (e.g., output fade-in on invalid), a `--animation-reduced` value is required.
