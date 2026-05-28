#!/usr/bin/env node
/**
 * graffiti-lookup
 *
 * Query the Graffiti registry (src/lib/registry.json) for patterns, tokens,
 * and their groups. Designed to be agent-friendly: give it a name, get the
 * canonical role/example/modifiers/source.
 *
 * Usage:
 *   graffiti-lookup <name>            exact lookup (with or without leading `.` or `--`)
 *   graffiti-lookup search <term>     substring search in name + role
 *   graffiti-lookup list              list everything grouped by kind
 *   graffiti-lookup list --patterns   limit to a kind (also --tokens, --pattern-groups, --token-groups)
 *
 * Flags (any command):
 *   --json    print machine-readable JSON instead of pretty text
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const filePath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(filePath);

// The script runs from two locations:
//   - dev/repo:   scripts/graffiti-lookup.mjs  → registry at ../src/lib/registry.json
//   - published:  dist/graffiti-lookup.mjs     → registry at ./registry.json (sibling)
// Try the published location first (it's the common case for `npx`), then
// fall back to the source-of-truth location for in-repo runs.
const REGISTRY_CANDIDATES = [
  path.join(scriptDir, "registry.json"),
  path.join(scriptDir, "..", "src", "lib", "registry.json"),
];

/* ------------------------------------------------------------------ *
 * Registry loading
 * ------------------------------------------------------------------ */

async function loadRegistry(candidates = REGISTRY_CANDIDATES) {
  for (const candidate of candidates) {
    try {
      return JSON.parse(await readFile(candidate, "utf8"));
    } catch (err) {
      if (err.code === "ENOENT") continue;
      throw err;
    }
  }
  throw new Error(
    `Registry not found (looked in: ${candidates
      .map((c) => path.relative(process.cwd(), c))
      .join(", ")}). Run \`pnpm lint:graffiti\` to generate it.`,
  );
}

/* ------------------------------------------------------------------ *
 * Normalization + matching
 * ------------------------------------------------------------------ */

/**
 * Normalize a user-typed query for matching:
 *   ".card"      -> "card"
 *   "card"       -> "card"
 *   "--vs-m"     -> "--vs-m"
 *   "vs-m"       -> stays "vs-m" (no leading -- assumed)
 */
export function normalizeQuery(q) {
  return q.startsWith(".") ? q.slice(1) : q;
}

/**
 * Find a registry entry whose name exactly matches the query.
 * Returns { kind, entry, memberOf? } or null.
 *
 * Match precedence (most specific first):
 *   1. pattern by name
 *   2. pattern-group by name
 *   3. token by name (with `--` prefix preserved)
 *   4. token-group by name
 *   5. token as a member of a token-group (returns the group, with memberOf=name)
 *   6. pattern as a member of a pattern-group (returns the group, with memberOf=name)
 */
export function findExact(registry, rawQuery) {
  const query = normalizeQuery(rawQuery);

  const pattern = registry.patterns.find((p) => p.name === query);
  if (pattern) return { kind: "pattern", entry: pattern };

  const patternGroup = registry.patternGroups.find((g) => g.name === query);
  if (patternGroup) return { kind: "pattern-group", entry: patternGroup };

  const token = registry.tokens.find((t) => t.name === query);
  if (token) return { kind: "token", entry: token };

  const tokenGroup = registry.tokenGroups.find((g) => g.name === query);
  if (tokenGroup) return { kind: "token-group", entry: tokenGroup };

  // Members of groups
  const tokenGroupOwner = registry.tokenGroups.find((g) =>
    g.members.includes(query),
  );
  if (tokenGroupOwner) {
    return { kind: "token-group", entry: tokenGroupOwner, memberOf: query };
  }

  const patternGroupOwner = registry.patternGroups.find((g) =>
    g.members.includes(query),
  );
  if (patternGroupOwner) {
    return {
      kind: "pattern-group",
      entry: patternGroupOwner,
      memberOf: query,
    };
  }

  return null;
}

/**
 * Substring search across names + role text. Returns an array of
 * { kind, entry, score } sorted by relevance (name matches outrank role matches).
 */
export function searchAll(registry, rawTerm) {
  const term = normalizeQuery(rawTerm).toLowerCase();
  const results = [];

  const scan = (entries, kind) => {
    for (const e of entries) {
      const name = e.name.toLowerCase();
      const role = (e.role ?? "").toLowerCase();
      let score = 0;
      if (name === term) score = 100;
      else if (name.startsWith(term)) score = 80;
      else if (name.includes(term)) score = 60;
      else if (role.includes(term)) score = 30;
      // Also consider member lists for groups
      if (score === 0 && Array.isArray(e.members)) {
        if (e.members.some((m) => m.toLowerCase().includes(term))) score = 50;
      }
      if (score > 0) results.push({ kind, entry: e, score });
    }
  };

  scan(registry.patterns, "pattern");
  scan(registry.patternGroups, "pattern-group");
  scan(registry.tokens, "token");
  scan(registry.tokenGroups, "token-group");

  results.sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name));
  return results;
}

/* ------------------------------------------------------------------ *
 * Pretty-printing
 * ------------------------------------------------------------------ */

const indent = (text, spaces = 2) =>
  text
    .split("\n")
    .map((line) => " ".repeat(spaces) + line)
    .join("\n");

function renderEntry(match) {
  const { kind, entry, memberOf } = match;
  const out = [];

  const displayName =
    kind === "pattern"
      ? `.${entry.name}`
      : kind === "pattern-group"
        ? entry.name
        : kind === "token"
          ? entry.name
          : entry.name;

  out.push(`${displayName}  [${kind}${memberOf ? ` member: ${memberOf}` : ""}]`);

  if (entry.role) out.push(`  Role:       ${entry.role}`);

  if (kind === "pattern-group" || kind === "token-group") {
    out.push(`  Category:   ${entry.category ?? "—"}`);
  } else if (kind === "token") {
    out.push(`  Category:   ${entry.category ?? "—"}`);
  }

  if (kind === "token-group" && entry.matches) {
    out.push(`  Matches:    ${entry.matches}`);
    if (entry.scale) out.push(`  Scale:      ${entry.scale}`);
  }

  if (Array.isArray(entry.members) && entry.members.length) {
    const members = entry.members.join(", ");
    out.push(`  Members:    ${members}`);
  }

  if (Array.isArray(entry.modifiers) && entry.modifiers.length) {
    out.push(`  Modifiers:  ${entry.modifiers.join(", ")}`);
  }

  if (entry.preferOver) {
    out.push(`  Prefer over: ${entry.preferOver}`);
  }

  if (Array.isArray(entry.related) && entry.related.length) {
    out.push(`  Related:    ${entry.related.join(", ")}`);
  }

  if (entry.since) out.push(`  Since:      ${entry.since}`);
  if (entry.deprecated) out.push(`  Deprecated: ${entry.deprecated}`);

  if (entry.example) {
    out.push(`  Example:`);
    out.push(indent(entry.example, 4));
  }

  if (entry.source) {
    const parts = [`${entry.source.file}:${entry.source.annotationLine}`];
    if (entry.source.declarationLine) {
      parts.push(`declaration at ${entry.source.file}:${entry.source.declarationLine}`);
    }
    out.push(`  Source:     ${parts.join(", ")}`);
  }

  return out.join("\n");
}

function renderSearch(results, term) {
  if (results.length === 0) return `No matches for "${term}".`;
  const lines = [`${results.length} match${results.length === 1 ? "" : "es"} for "${term}":\n`];
  for (const r of results) {
    const name =
      r.kind === "pattern" ? `.${r.entry.name}` : r.entry.name;
    const role = r.entry.role ? ` — ${r.entry.role}` : "";
    lines.push(`  ${name}  [${r.kind}]${role}`);
  }
  return lines.join("\n");
}

function renderList(registry, only) {
  const sections = [];
  const include = (key) => !only || only === key;

  if (include("patterns")) {
    sections.push(
      `Patterns (${registry.patterns.length}):\n` +
        registry.patterns
          .map((p) => `  .${p.name}  — ${p.role ?? ""}`)
          .join("\n"),
    );
  }
  if (include("pattern-groups")) {
    sections.push(
      `Pattern groups (${registry.patternGroups.length}):\n` +
        registry.patternGroups
          .map((g) => `  ${g.name}  [${g.members.length} members]  — ${g.role ?? ""}`)
          .join("\n"),
    );
  }
  if (include("tokens")) {
    sections.push(
      `Tokens (${registry.tokens.length}):\n` +
        registry.tokens
          .map((t) => `  ${t.name}  — ${t.role ?? ""}`)
          .join("\n"),
    );
  }
  if (include("token-groups")) {
    sections.push(
      `Token groups (${registry.tokenGroups.length}):\n` +
        registry.tokenGroups
          .map((g) => `  ${g.name}  [matches ${g.matches}, ${g.members.length} tokens]  — ${g.role ?? ""}`)
          .join("\n"),
    );
  }

  return sections.join("\n\n");
}

/* ------------------------------------------------------------------ *
 * CLI
 * ------------------------------------------------------------------ */

function usage() {
  return `graffiti-lookup — query the Graffiti registry

Usage:
  graffiti-lookup <name>             exact match (with or without leading . or --)
  graffiti-lookup search <term>      substring search in name + role
  graffiti-lookup list               list everything
  graffiti-lookup list --patterns    limit to one kind (also --tokens, --pattern-groups, --token-groups)

Flags (any command):
  --json    machine-readable output
  --help    this message`;
}

async function main() {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const filtered = args.filter((a) => a !== "--json");

  if (filtered.length === 0 || filtered.includes("--help") || filtered.includes("-h")) {
    console.log(usage());
    process.exit(filtered.length === 0 ? 1 : 0);
  }

  const registry = await loadRegistry();

  if (filtered[0] === "list") {
    let only = null;
    if (filtered.includes("--patterns")) only = "patterns";
    else if (filtered.includes("--pattern-groups")) only = "pattern-groups";
    else if (filtered.includes("--tokens")) only = "tokens";
    else if (filtered.includes("--token-groups")) only = "token-groups";

    if (json) {
      const payload = {};
      if (!only || only === "patterns") payload.patterns = registry.patterns;
      if (!only || only === "pattern-groups") payload.patternGroups = registry.patternGroups;
      if (!only || only === "tokens") payload.tokens = registry.tokens;
      if (!only || only === "token-groups") payload.tokenGroups = registry.tokenGroups;
      console.log(JSON.stringify(payload, null, 2));
    } else {
      console.log(renderList(registry, only));
    }
    return;
  }

  if (filtered[0] === "search") {
    const term = filtered.slice(1).join(" ").trim();
    if (!term) {
      console.error("Usage: graffiti-lookup search <term>");
      process.exit(1);
    }
    const results = searchAll(registry, term);
    if (json) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      console.log(renderSearch(results, term));
    }
    process.exit(results.length === 0 ? 1 : 0);
  }

  // Default: exact lookup of the first non-flag argument
  const query = filtered[0];
  const match = findExact(registry, query);
  if (!match) {
    if (json) {
      console.log(JSON.stringify(null));
    } else {
      const hints = searchAll(registry, query).slice(0, 5);
      console.error(`No exact match for "${query}".`);
      if (hints.length) {
        console.error(`\nDid you mean:`);
        for (const r of hints) {
          const name = r.kind === "pattern" ? `.${r.entry.name}` : r.entry.name;
          console.error(`  ${name}  [${r.kind}]`);
        }
        console.error(`\nRun \`graffiti-lookup search ${query}\` for the full list.`);
      }
    }
    process.exit(1);
  }

  if (json) {
    console.log(JSON.stringify(match, null, 2));
  } else {
    console.log(renderEntry(match));
  }
}

const isCli =
  process.argv[1] && path.resolve(process.argv[1]) === filePath;
if (isCli) {
  await main().catch((err) => {
    console.error(`graffiti-lookup: ${err.message}`);
    process.exit(1);
  });
}
