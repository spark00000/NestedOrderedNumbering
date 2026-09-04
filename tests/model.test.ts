import { describe, expect, it } from "vitest";
import {
  parseNumberedLine,
  renumberText,
  transformDeleteNumbering,
  transformEnter,
  transformIndent,
  transformInsertNumbering,
} from "../src/model";

describe("number parser", () => {
  it("requires a trailing period", () => {
    expect(parseNumberedLine("1. item")?.number).toBe("1.");
    expect(parseNumberedLine("    1.2.3. item")?.number).toBe("1.2.3.");
    expect(parseNumberedLine("1 item")).toBeNull();
    expect(parseNumberedLine("1.2 item")).toBeNull();
  });
});

describe("renumbering", () => {
  it("recalculates a contiguous hierarchical block", () => {
    const input = [
      "7. Alpha",
      "    9.4. Beta",
      "        8.8.8. Gamma",
      "    3.2. Delta",
      "4. Epsilon",
    ].join("\n");
    expect(renumberText(input)).toBe([
      "1. Alpha",
      "  1.1. Beta",
      "    1.1.1. Gamma",
      "  1.2. Delta",
      "2. Epsilon",
    ].join("\n"));
  });

  it("normalizes legacy four-space levels to a fixed content rhythm", () => {
    const input = "1. Alpha\n    1.1. Beta\n        1.1.1. Gamma";
    expect(renumberText(input)).toBe("1. Alpha\n  1.1. Beta\n    1.1.1. Gamma");
  });

  it("keeps every hierarchy step at exactly two raw spaces", () => {
    const input = [
      "9. Root",
      "    8.8. Child",
      "        7.7.7. Grandchild",
      "            6.6.6.6. Great-grandchild",
    ].join("\n");
    expect(renumberText(input)).toBe([
      "1. Root",
      "  1.1. Child",
      "    1.1.1. Grandchild",
      "      1.1.1.1. Great-grandchild",
    ].join("\n"));
  });

  it("keeps separate blocks independent", () => {
    expect(renumberText("9. One\nplain text\n8. Two")).toBe("1. One\nplain text\n1. Two");
  });

  it("continues one numbered block across blank lines", () => {
    expect(renumberText("9. One\n\n8. Two")).toBe("1. One\n\n2. Two");
  });
});

describe("editing transforms", () => {
  it("Enter creates the next sibling with a final period", () => {
    const input = "1. Root\n    1.1. Child";
    const cursor = input.length;
    const result = transformEnter(input, { anchor: cursor, head: cursor });
    expect(result?.text).toBe("1. Root\n  1.1. Child\n  1.2. ");
    expect(result?.selection.anchor).toBe(result?.text.length);
  });

  it("Enter on an empty numbered item exits numbering with one plain blank line", () => {
    const input = "1. First\n2. Second\n3. ";
    const result = transformEnter(input, { anchor: input.length, head: input.length });
    const expected = "1. First\n2. Second\n";
    expect(result?.text).toBe(expected);
    expect(result?.selection).toEqual({ anchor: expected.length, head: expected.length });
  });

  it("renumbers following items after an empty numbered item exits numbering", () => {
    const input = "1. First\n2. \n3. Third";
    const cursor = input.indexOf("2. ") + "2. ".length;
    const result = transformEnter(input, { anchor: cursor, head: cursor });
    const expected = "1. First\n\n2. Third";
    const blankLineStart = expected.indexOf("\n") + 1;
    expect(result?.text).toBe(expected);
    expect(result?.selection).toEqual({ anchor: blankLineStart, head: blankLineStart });
  });

  it("Enter removes an empty nested prefix and its indentation", () => {
    const input = "1. Root\n  1.1.    ";
    const result = transformEnter(input, { anchor: input.length, head: input.length });
    expect(result?.text).toBe("1. Root\n");
    expect(result?.selection.anchor).toBe(result?.text.length);
  });

  it("Tab indents the current item and its subtree", () => {
    const input = "1. Alpha\n2. Beta\n    2.1. Child\n3. Gamma";
    const cursor = input.indexOf("Beta");
    const result = transformIndent(input, { anchor: cursor, head: cursor }, "indent");
    expect(result?.text).toBe("1. Alpha\n  1.1. Beta\n    1.1.1. Child\n2. Gamma");
  });

  it("restores a downstream root number when an inserted item becomes a child", () => {
    const input = "1. First\n\n2. Second";
    const cursor = input.indexOf("\n");
    const entered = transformEnter(input, { anchor: cursor, head: cursor });
    expect(entered?.text).toBe("1. First\n2. \n\n3. Second");

    const indented = entered && transformIndent(entered.text, entered.selection, "indent");
    expect(indented?.text).toBe("1. First\n  1.1. \n\n2. Second");
  });

  it("Shift+Tab outdents the current item and its subtree", () => {
    const input = "1. Alpha\n  1.1. Beta\n    1.1.1. Child\n  1.2. Delta";
    const cursor = input.indexOf("Beta");
    const result = transformIndent(input, { anchor: cursor, head: cursor }, "outdent");
    expect(result?.text).toBe("1. Alpha\n2. Beta\n  2.1. Child\n  2.2. Delta");
  });

  it("Shift+Tab on a root item converts it to plain text and lifts its subtree", () => {
    const input = "1. Alpha\n    1.1. Child\n2. Beta";
    const cursor = input.indexOf("Alpha");
    const result = transformIndent(input, { anchor: cursor, head: cursor }, "outdent");
    expect(result?.text).toBe("Alpha\n1. Child\n2. Beta");
    expect(result?.selection.anchor).toBe(0);
  });

  it("supports a multi-line selection", () => {
    const input = "1. Alpha\n2. Beta\n    2.1. Child\n3. Gamma";
    const anchor = input.indexOf("2. Beta");
    const head = input.indexOf("3. Gamma");
    const result = transformIndent(input, { anchor, head }, "indent");
    expect(result?.text).toBe("1. Alpha\n  1.1. Beta\n    1.1.1. Child\n2. Gamma");
  });

  it("inserts numbering on selected plain-text lines", () => {
    const input = "Alpha\nBeta";
    const result = transformInsertNumbering(input, { anchor: 0, head: input.length });
    expect(result?.text).toBe("1. Alpha\n2. Beta");
  });

  it("deletes numbering and renumbers the neighboring block", () => {
    const input = "1. Alpha\n2. Beta";
    const result = transformDeleteNumbering(input, { anchor: 0, head: input.indexOf("\n") });
    expect(result?.text).toBe("Alpha\n1. Beta");
  });

  it("insert numbering leaves blank separator lines blank", () => {
    const input = "Alpha\n\nBeta";
    const result = transformInsertNumbering(input, { anchor: 0, head: input.length });
    expect(result?.text).toBe("1. Alpha\n\n2. Beta");
  });

  it("derives depth relative to indentation rather than absolute columns", () => {
    // The 7-column "b" line would distort the absolute GCD unit to 1 and push
    // the shallower "c" to depth 3; relative ordering keeps it a sibling of "a".
    const input = "1. Root\n   1.1. a\n      1.1.1. b\n   1.2. c";
    expect(renumberText(input)).toBe(
      "1. Root\n  1.1. a\n    1.1.1. b\n  1.2. c",
    );
  });

  it("keeps deeper items nested under the current indentation context", () => {
    // The second 4-column line must nest under the intervening 2-column line,
    // not inherit the depth of the earlier 4-column line that shares its column.
    const input = "1. Root\n    1.1. A\n  1.2. B\n    1.2.1. C";
    expect(renumberText(input)).toBe(
      "1. Root\n  1.1. A\n  1.2. B\n    1.2.1. C",
    );
  });
});
