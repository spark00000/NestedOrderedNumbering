import { describe, expect, it } from "vitest";
import { transformStandaloneMarkdownStart } from "../src/standalone-markdown";

describe("standalone Markdown auto-exit", () => {
  it.each([
    ["1. ```", "```"],
    ["1. ~~~python", "~~~python"],
    ["  5.1. ```typescript", "```typescript"],
    ["1. # Heading", "# Heading"],
    ["1. ## Heading", "## Heading"],
    ["1. > quote", "> quote"],
    ["1. - bullet", "- bullet"],
    ["1. * bullet", "* bullet"],
    ["1. + bullet", "+ bullet"],
  ])("removes numbering when content starts a standalone Markdown block: %s", (input, expected) => {
    const result = transformStandaloneMarkdownStart(input, {
      anchor: input.length,
      head: input.length,
    });
    expect(result?.text).toBe(expected);
    expect(result?.selection).toEqual({
      anchor: expected.length,
      head: expected.length,
    });
  });

  it.each([
    "1. `inline code`",
    "1. #tag",
    "1. >quote",
    "1. -not-a-list",
    "1. **bold**",
    "1. ordinary text",
  ])("does not remove numbering for ordinary content: %s", (input) => {
    expect(
      transformStandaloneMarkdownStart(input, {
        anchor: input.length,
        head: input.length,
      }),
    ).toBeNull();
  });

  it("keeps a fenced block transparent to the surrounding number sequence", () => {
    const input = [
      "1. Before",
      "2. ```",
      "code",
      "```",
      "3. After",
    ].join("\n");
    const fenceCursor = input.indexOf("2. ```") + "2. ```".length;

    const result = transformStandaloneMarkdownStart(input, {
      anchor: fenceCursor,
      head: fenceCursor,
    });

    expect(result?.text).toBe([
      "1. Before",
      "```",
      "code",
      "```",
      "2. After",
    ].join("\n"));
  });

  it("drops nested numbering indentation when opening a standalone code fence", () => {
    const input = "5. Parent\n  5.1. ```";
    const result = transformStandaloneMarkdownStart(input, {
      anchor: input.length,
      head: input.length,
    });

    expect(result?.text).toBe("1. Parent\n```");
  });
});
