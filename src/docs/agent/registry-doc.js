/**
 * registry-doc.js
 *
 * Pure renderer: turns the Graffiti registry (src/lib/registry.json, emitted by
 * scripts/graffiti-lint.mjs) into a complete agent-facing markdown catalogue.
 *
 * This is the machine-generated, exhaustive counterpart to the hand-curated
 * narrative sections in manifest.js. Every pattern and token that exists in
 * drop-in.css appears here with its role + example, so an agent can resolve
 * "which class do I use" from a single document without grepping the CSS.
 *
 * Kept dependency-free (no fs, no app aliases) so it is unit-testable in plain
 * node and reusable by both the runtime route handler and any static export.
 */

/**
 * @typedef {Object} RegistryPattern
 * @property {string} name
 * @property {string} role
 * @property {string} [example]
 * @property {string[]} [modifiers]
 * @property {string|null} [preferOver]
 * @property {string[]} [related]
 * @property {string|null} [since]
 * @property {string|null} [deprecated]
 */

/**
 * @typedef {Object} Registry
 * @property {RegistryPattern[]} patterns
 * @property {Object[]} patternGroups
 * @property {Object[]} tokens
 * @property {Object[]} tokenGroups
 */

/** @param {string} text */
function trimTrailing(text) {
  return text.replace(/[ \t]+$/gm, "");
}

/** @param {string[]|undefined} list */
function joinList(list) {
  return Array.isArray(list) && list.length ? list.join(", ") : "";
}

/**
 * Render a single pattern (or pattern-group) entry.
 * @param {RegistryPattern & { members?: string[] }} entry
 * @param {{ isGroup?: boolean }} [opts]
 */
function renderPattern(entry, { isGroup = false } = {}) {
  const heading = isGroup ? `### ${entry.name} (group)` : `### .${entry.name}`;
  const lines = [heading, "", entry.role || "_No role documented._"];

  if (isGroup && Array.isArray(entry.members) && entry.members.length) {
    lines.push("", `**Classes:** ${entry.members.map((m) => `\`.${m}\``).join(", ")}`);
  }
  if (entry.modifiers && entry.modifiers.length) {
    lines.push("", `**Modifiers:** ${entry.modifiers.map((m) => `\`.${m}\``).join(", ")}`);
  }
  if (entry.preferOver) {
    lines.push("", `**Prefer over:** ${entry.preferOver}`);
  }
  if (entry.related && entry.related.length) {
    lines.push("", `**Related:** ${joinList(entry.related)}`);
  }
  if (entry.deprecated) {
    lines.push("", `**Deprecated:** ${entry.deprecated}`);
  }
  if (entry.example) {
    lines.push("", "```html", entry.example.trim(), "```");
  }
  return lines.join("\n");
}

/**
 * Render a token (or token-group) entry.
 * @param {{ name: string, role: string, category?: string, matches?: string, scale?: string|null, members?: string[], deprecated?: string|null }} entry
 * @param {{ isGroup?: boolean }} [opts]
 */
function renderToken(entry, { isGroup = false } = {}) {
  const heading = isGroup ? `### ${entry.name} (group)` : `### ${entry.name}`;
  const lines = [heading, "", entry.role || "_No role documented._"];

  const meta = [];
  if (entry.category) meta.push(`category: ${entry.category}`);
  if (isGroup && entry.matches) meta.push(`matches: \`${entry.matches}\``);
  if (isGroup && entry.scale) meta.push(`scale: ${entry.scale}`);
  if (meta.length) lines.push("", `_${meta.join(" · ")}_`);

  if (isGroup && Array.isArray(entry.members) && entry.members.length) {
    const shown = entry.members.slice(0, 16);
    const extra = entry.members.length - shown.length;
    const list = shown.map((m) => `\`${m}\``).join(", ") + (extra > 0 ? `, …(+${extra})` : "");
    lines.push("", `**Tokens:** ${list}`);
  }
  if (entry.deprecated) {
    lines.push("", `**Deprecated:** ${entry.deprecated}`);
  }
  return lines.join("\n");
}

/**
 * Render the complete registry as an agent-facing markdown catalogue.
 *
 * @param {Registry} registry
 * @param {{ siteUrl?: string }} [opts]
 * @returns {string}
 */
export function renderRegistryCatalogMarkdown(registry, { siteUrl = "https://graffiti-ui.com" } = {}) {
  const patterns = [...(registry.patterns ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  const patternGroups = [...(registry.patternGroups ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  const tokenGroups = [...(registry.tokenGroups ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  const tokens = [...(registry.tokens ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  const counts = `${patterns.length} patterns, ${patternGroups.length} pattern groups, ${tokens.length + tokenGroups.length} token entries`;

  const frontmatter = [
    "---",
    `title: "Graffiti Pattern & Token Catalogue"`,
    `url: ${siteUrl}/patterns`,
    `description: "Complete machine-generated catalogue of every Graffiti class and token with role and example. Source of truth for which class to use."`,
    "---",
  ].join("\n");

  // Quick-reference index: name — role (one line each), so an agent can scan.
  const patternIndex = [...patterns, ...patternGroups]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p) => `- \`.${p.name}\` — ${p.role ?? ""}`)
    .join("\n");

  const patternBody = patterns.map((p) => renderPattern(p)).join("\n\n");
  const patternGroupBody = patternGroups
    .map((g) => renderPattern(g, { isGroup: true }))
    .join("\n\n");
  const tokenBody = tokens.map((t) => renderToken(t)).join("\n\n");
  const tokenGroupBody = tokenGroups
    .map((g) => renderToken(g, { isGroup: true }))
    .join("\n\n");

  const doc = `${frontmatter}

# Graffiti Pattern & Token Catalogue

Complete, machine-generated from \`drop-in.css\` annotations (${counts}). Every
class and token below is enforced to exist and stay documented by the
\`graffiti-lint\` check. Use this to pick the canonical class for a job before
writing custom CSS.

## Pattern index

${patternIndex}

---

## Patterns

${patternBody}

## Pattern groups

${patternGroupBody}

## Tokens

${tokenBody}

## Token groups

${tokenGroupBody}
`;

  return trimTrailing(doc);
}
