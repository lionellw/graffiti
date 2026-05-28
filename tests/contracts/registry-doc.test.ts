import { describe, expect, it } from "vitest";
// @ts-expect-error — plain JS module, no types
import { renderRegistryCatalogMarkdown } from "../../src/docs/agent/registry-doc.js";

const registry = {
  patterns: [
    {
      name: "card",
      role: "Content surface",
      example: '<article class="card">x</article>',
      modifiers: ["linked", "featured"],
      related: ["stat-card"],
    },
    { name: "box", role: "Neutral container" },
  ],
  patternGroups: [
    {
      name: "aspect-ratios",
      role: "Lock aspect ratio",
      members: ["aspect-square", "aspect-video"],
      example: '<div class="aspect-video"></div>',
    },
  ],
  tokens: [{ name: "--font-sans", role: "Default sans stack", category: "typography" }],
  tokenGroups: [
    {
      name: "vertical-spacing",
      role: "Vertical rhythm scale",
      category: "spacing",
      matches: "--vs-*",
      scale: "xs, s, m",
      members: ["--vs-xs", "--vs-s", "--vs-m"],
    },
  ],
};

describe("renderRegistryCatalogMarkdown", () => {
  const md = renderRegistryCatalogMarkdown(registry, { siteUrl: "https://example.com" });

  it("emits frontmatter pointing at /patterns", () => {
    expect(md.startsWith("---")).toBe(true);
    expect(md).toContain("url: https://example.com/patterns");
  });

  it("includes a scannable pattern index line for each pattern", () => {
    expect(md).toContain("- `.card` — Content surface");
    expect(md).toContain("- `.box` — Neutral container");
  });

  it("renders a pattern with its example as an html code block", () => {
    expect(md).toContain("### .card");
    expect(md).toContain("```html");
    expect(md).toContain('<article class="card">x</article>');
  });

  it("renders modifiers and related for a pattern", () => {
    expect(md).toContain("**Modifiers:** `.linked`, `.featured`");
    expect(md).toContain("**Related:** stat-card");
  });

  it("labels pattern-groups and lists their member classes", () => {
    expect(md).toContain("### aspect-ratios (group)");
    expect(md).toContain("`.aspect-square`, `.aspect-video`");
  });

  it("renders token-groups with category, matches glob, and members", () => {
    expect(md).toContain("### vertical-spacing (group)");
    expect(md).toContain("matches: `--vs-*`");
    expect(md).toContain("`--vs-xs`, `--vs-s`, `--vs-m`");
  });

  it("renders standalone tokens", () => {
    expect(md).toContain("### --font-sans");
    expect(md).toContain("Default sans stack");
  });

  it("reports accurate counts in the preamble", () => {
    // 2 patterns, 1 pattern group, 1 token + 1 token group = 2 token entries
    expect(md).toContain("2 patterns, 1 pattern groups, 2 token entries");
  });

  it("sorts patterns alphabetically in the index", () => {
    const boxIdx = md.indexOf("- `.box`");
    const cardIdx = md.indexOf("- `.card`");
    expect(boxIdx).toBeGreaterThan(-1);
    expect(boxIdx).toBeLessThan(cardIdx);
  });

  it("handles a missing example without crashing", () => {
    expect(md).toContain("### .box");
    // box has no example → no stray empty code fence right after its role
    const boxSection = md.slice(md.indexOf("### .box"));
    expect(boxSection.slice(0, 60)).not.toContain("```html");
  });
});
