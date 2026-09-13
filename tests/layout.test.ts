import { describe, expect, it } from "vitest";
import {
  expandTabs,
  numberedLineHangingParts,
} from "../src/layout";

describe("numbered-line hanging indent", () => {
  it("leaves standard root list markers to Obsidian's native list layout", () => {
    expect(numberedLineHangingParts("6. text")).toBeNull();
    expect(numberedLineHangingParts("10. text")).toBeNull();
  });

  it.each([
    ["  9.1. text", {
      sourceIndentText: "  ",
      visualIndentColumns: 2,
      markerText: "9.1. ",
      markerFrom: 2,
      markerTo: 7,
    }],
    ["    9.1.1. text", {
      sourceIndentText: "    ",
      visualIndentColumns: 4,
      markerText: "9.1.1. ",
      markerFrom: 4,
      markerTo: 11,
    }],
    ["      9.1.1.1. text", {
      sourceIndentText: "      ",
      visualIndentColumns: 6,
      markerText: "9.1.1.1. ",
      markerFrom: 6,
      markerTo: 15,
    }],
    ["  10.12. text", {
      sourceIndentText: "  ",
      visualIndentColumns: 2,
      markerText: "10.12. ",
      markerFrom: 2,
      markerTo: 9,
    }],
  ] as const)("separates hierarchy depth and marker for %j", (line, expected) => {
    expect(numberedLineHangingParts(line)).toEqual(expected);
  });

  it("derives visual hierarchy from numeric depth, not rendered source-indent DOM", () => {
    expect(numberedLineHangingParts("9.1. text")?.visualIndentColumns).toBe(2);
    expect(numberedLineHangingParts("9.1.1. text")?.visualIndentColumns).toBe(4);
    expect(numberedLineHangingParts("9.1.1.1. text")?.visualIndentColumns).toBe(6);
  });

  it("keeps the source indentation available for editor/model semantics", () => {
    const parts = numberedLineHangingParts("    9.1.1. text");
    expect(parts).not.toBeNull();
    expect(parts?.sourceIndentText).toBe("    ");
    expect(parts?.markerFrom).toBe(4);
    expect(parts?.markerTo).toBe(11);
  });

  it("expands tabs using the same two-column stops as the editor CSS", () => {
    expect(expandTabs("\t1.1.\t")).toBe("  1.1.  ");
    expect(expandTabs("a\tb", 2)).toBe("a b");
    expect(expandTabs("ab\tc", 2)).toBe("ab  c");
  });

  it("does not assign a hanging indent to unnumbered text", () => {
    expect(numberedLineHangingParts("plain text")).toBeNull();
  });
});
