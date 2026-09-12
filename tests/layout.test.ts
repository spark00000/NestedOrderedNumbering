import { describe, expect, it } from "vitest";
import {
  expandTabs,
  numberedLineHangingPrefixText,
} from "../src/layout";

describe("numbered-line hanging indent", () => {
  it("leaves standard root list markers to Obsidian's native list layout", () => {
    expect(numberedLineHangingPrefixText("6. text")).toBeNull();
    expect(numberedLineHangingPrefixText("10. text")).toBeNull();
  });

  it.each([
    ["  9.1. text", "  9.1. "],
    ["  10.1. text", "  10.1. "],
    ["    1.1.1. text", "    1.1.1. "],
    ["      10.12.3. text", "      10.12.3. "],
  ] as const)("extracts the complete custom prefix from %j", (line, prefix) => {
    expect(numberedLineHangingPrefixText(line)).toBe(prefix);
  });

  it("expands tabs using the same two-column stops as the editor CSS", () => {
    expect(expandTabs("\t1.1.\t")).toBe("  1.1.  ");
    expect(expandTabs("a\tb", 2)).toBe("a b");
    expect(expandTabs("ab\tc", 2)).toBe("ab  c");
  });

  it("does not assign a hanging indent to unnumbered text", () => {
    expect(numberedLineHangingPrefixText("plain text")).toBeNull();
  });
});
