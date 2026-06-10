# Graffiti Annotation Spec

Structured comments above every pattern and token in `src/lib/drop-in.css`. These annotations:

1. Force authors (human or agent) to articulate the role and intended use of every public surface.
2. Feed `registry.json` — the canonical machine-readable catalogue of Graffiti's patterns and tokens, consumed by lookup tools, MCP servers, and downstream lint.

Lint is enforced by `npm run lint:graffiti` (also runs pre-commit). A missing or malformed annotation fails the lint.

## Scope

The lint and registry consider **only** `src/lib/drop-in.css`. `src/lib/themes/*` is out of scope.

## What requires annotation

A rule **requires annotation** if its selector is exactly `.classname` — one class, no compound, no descendant, no qualifier, no state — at the top level of a `@layer` block.

A custom property declaration **requires annotation** if it appears at `:root` inside `@layer base`.

Everything else is exempt:

| Construct | Annotated? | Why |
|---|---|---|
| `.box { ... }` | yes | Primary pattern definition |
| `.box.ghost { ... }` | no | Modifier — list it in parent's `@modifiers` |
| `.box > *`, `.card > header` | no | Internal child rule of an annotated pattern |
| `:is(form) .row { ... }` | no | Qualified context override |
| `&.modifier { ... }` inside a nested rule | no | Modifier of the enclosing pattern |
| Any rule inside `@container`/`@media`/`@supports` | no | Adaptive override of an already-annotated pattern |
| `--bg: ...` inside `@layer themes` or a scope | no | Theme/scope override; not a new token |
| `--bg: ...` at `:root` inside `@layer base` | yes | Canonical token declaration |

## Pattern annotation

```css
/**
 * @pattern stat-card
 * @role Surfaces a single metric with label + value
 * @example
 *   <article class="stat-card">
 *     <p class="label">Active users</p>
 *     <p class="value">1,284</p>
 *   </article>
 * @modifiers tone-positive, tone-warning, size-sm, size-lg
 * @prefer-over .box plus manual padding and typography
 * @related feature-card, callout
 * @since 4.20.0
 */
.stat-card { ... }
```

| Tag | Required | Notes |
|---|---|---|
| `@pattern <name>` | yes | Must match the selector exactly (without leading `.`) |
| `@role <one line>` | yes | What problem this pattern solves, in plain language |
| `@example` | yes | Block of HTML showing minimal correct usage |
| `@modifiers` | no | Comma-separated list of compound-class modifiers (e.g. `.box.ghost` → `ghost`) |
| `@prefer-over` | no | Names a pattern or "custom: …" that this replaces |
| `@related` | no | Comma-separated list of other registered patterns; lint verifies each resolves |
| `@since <version>` | no | First version that shipped this pattern |
| `@deprecated <reason>` | no | Marks the pattern as deprecated in the registry |

## Pattern group annotation

For sibling utilities that share a single role (`.aspect-*`, `.fs-*`, `.gradient-*`, `.h1`–`.h6`, etc.), use one group block covering all members. Members must be the immediately-following primary class definitions before the next annotation block.

```css
/**
 * @pattern-group aspect-ratios
 * @members aspect-square, aspect-video, aspect-21-9, aspect-4-3, aspect-custom
 * @role Aspect ratio constraints for media containers
 * @example <div class="aspect-video"><img src="..." alt=""></div>
 * @since 4.18.0
 */
.aspect-square { aspect-ratio: 1; }
.aspect-video { aspect-ratio: 16 / 9; }
.aspect-21-9 { aspect-ratio: 21 / 9; }
.aspect-4-3 { aspect-ratio: 4 / 3; }
.aspect-custom { aspect-ratio: var(--aspect, 16 / 9); }
```

| Tag | Required | Notes |
|---|---|---|
| `@pattern-group <name>` | yes | Group identifier (kebab-case) |
| `@members <a, b, c>` | yes | Comma-separated class names; must match every primary def the block covers, no extras |
| `@role <one line>` | yes | Shared role across the family |
| `@example` | yes | One HTML snippet showing a representative member |
| `@prefer-over`, `@related`, `@since`, `@deprecated` | no | Same semantics as `@pattern` |

The lint pairs the group block with the rules that follow it. If the count or names diverge from `@members`, lint fails.

## Token annotation

For standalone tokens that don't belong to a scale.

```css
/**
 * @token --font-sans
 * @category typography
 * @role Default sans-serif font stack
 */
--font-sans:
  -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica,
  Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
```

| Tag | Required | Notes |
|---|---|---|
| `@token <--name>` | yes | Must match the declaration exactly, including `--` prefix |
| `@category <slug>` | yes | One of: `typography`, `spacing`, `radius`, `color`, `shadow`, `motion`, `border`, `layout`, `z-index`, `misc` |
| `@role <one line>` | yes | What this token is for |
| `@since`, `@deprecated` | no | Same as `@pattern` |

## Token group annotation

For scale families and color scales — most tokens in `drop-in.css` will use this form.

```css
/**
 * @token-group vertical-spacing
 * @matches --vs-*
 * @category spacing
 * @role Vertical rhythm scale; use for stack gap and block margin
 * @scale xs, s, base, m, l, xl, xxl, xxxl
 */
--vs-xs: 0.25rem;
--vs-s: 0.5rem;
--vs-base: 1rem;
--vs-m: 1.5rem;
--vs-l: 2rem;
--vs-xl: 4rem;
--vs-xxl: 6rem;
--vs-xxxl: 8rem;
```

| Tag | Required | Notes |
|---|---|---|
| `@token-group <name>` | yes | Kebab-case group id |
| `@matches <pattern>` | yes | One or more comma-separated glob patterns; a token is "covered" if it matches any pattern. `*` is the only wildcard. Examples: `--vs-*`, `--amber-*`, `--yellow, --amber, --orange`. |
| `@category <slug>` | yes | Same vocabulary as `@token` |
| `@role <one line>` | yes | Shared role |
| `@scale <list>` | no | Comma-separated step names for human reference |
| `@since`, `@deprecated` | no | Same as `@token` |

The lint pairs the group block with the contiguous token declarations that follow. If a declaration doesn't match the glob, lint fails.

## Validation rules

The lint, in order:

1. **Coverage** — every primary class def has either its own `@pattern` block immediately above or is listed in a preceding `@pattern-group` `@members`. Every `:root`/`@layer base` token has either `@token` or matches a preceding `@token-group` `@matches`.
2. **Name agreement** — `@pattern` / `@token` name must match the selector / declaration that follows.
3. **Required tags present** — see tables above.
4. **`@example` syntax** — non-empty, indented HTML block.
5. **`@related` resolves** — every name in `@related` is a registered pattern or pattern-group.
6. **`@members` exact** — group's `@members` list equals the set of primary class defs it covers, in order.
7. **`@matches` exhaustive** — every token in a group's scope matches its glob; no token outside the glob slips into the group.
8. **No duplicates** — a pattern or token name can be registered only once.

Each failure prints the file, line, name, and the specific rule violated.

## Running

```bash
npm run lint:graffiti          # validates and writes registry.json on success
npm run lint:graffiti -- --check  # validates only, no registry write (CI mode)
```

The pre-commit hook runs the lint when `src/lib/drop-in.css` is staged.

## `registry.json` shape

The lint emits `dist/registry.json` (or `src/lib/registry.json` if exported as a package surface — TBD):

```json
{
  "patterns": [
    {
      "name": "stat-card",
      "kind": "pattern",
      "role": "Surfaces a single metric with label + value",
      "example": "<article class=\"stat-card\">...</article>",
      "modifiers": ["tone-positive", "tone-warning", "size-sm", "size-lg"],
      "preferOver": ".box plus manual padding and typography",
      "related": ["feature-card", "callout"],
      "since": "4.20.0",
      "deprecated": null,
      "source": { "file": "src/lib/drop-in.css", "line": 2868 }
    }
  ],
  "patternGroups": [...],
  "tokens": [...],
  "tokenGroups": [...]
}
```
