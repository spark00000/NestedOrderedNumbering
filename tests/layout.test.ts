import { describe, expect, it } from "vitest";
import {
  expandTabs,
  hangingIndentGeometry,
  numberedLineHangingParts,
} from "../src/layout";

describe("numbered-line hanging indent", () => {
  it.each([
    ["6. text", {
      sourceIndentText: "",
      visualIndentColumns: 0,
      markerText: "6. ",
      markerFrom: 0,
      markerTo: 3,
    }],
    ["10. text", {
      sourceIndentText: "",
      visualIndentColumns: 0,
      markerText: "10. ",
      markerFrom: 0,
      markerTo: 4,
    }],
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
  ] as const)("derives complete source parts for %j", (line, expected) => {
    expect(numberedLineHangingParts(line)).toEqual(expected);
  });

  it("keeps numeric depth metadata but does not add an independent offset", () => {
    expect(numberedLineHangingParts("9. text")?.visualIndentColumns).toBe(0);
    expect(numberedLineHangingParts("  9.1. text")?.visualIndentColumns).toBe(2);
    expect(numberedLineHangingParts("    9.1.1. text")?.visualIndentColumns).toBe(4);
    expect(numberedLineHangingParts("      9.1.1.1. text")?.visualIndentColumns).toBe(6);
  });

  it("reserves source indent plus marker for wrapped content but pulls back only the marker", () => {
    expect(hangingIndentGeometry(0, 30)).toEqual({
      contentIndent: 30,
      firstLineTextIndent: -30,
    });
    expect(hangingIndentGeometry(20, 50)).toEqual({
      contentIndent: 70,
      firstLineTextIndent: -50,
    });
    expect(hangingIndentGeometry(40, 70)).toEqual({
      contentIndent: 110,
      firstLineTextIndent: -70,
    });
  });

  it("places the first marker at the source hierarchy column", () => {
    const sourceIndentWidth = 20;
    const markerWidth = 50;
    const geometry = hangingIndentGeometry(sourceIndentWidth, markerWidth);

    expect(geometry.contentIndent + geometry.firstLineTextIndent).toBe(sourceIndentWidth);
    expect(geometry.contentIndent).toBe(sourceIndentWidth + markerWidth);
  });

  it("keeps parent geometry unchanged when a child/fold widget appears", () => {
    const beforeChild = hangingIndentGeometry(0, 30);
    const afterChild = hangingIndentGeometry(0, 30);
    expect(afterChild).toEqual(beforeChild);
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
