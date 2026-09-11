import { describe, expect, it } from "vitest";
import {
  parseNumberedLine,
  renumberText,
  transformDeleteNumbering,
  transformEnter,
  transformIndent,
  transformInsertNumbering,
  transformRenumber,
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
    const input = "1. Root\n   1.1. a\n      1.1.1. b\n   1.2. c";
    expect(renumberText(input)).toBe(
      "1. Root\n  1.1. a\n    1.1.1. b\n  1.2. c",
    );
  });

  it("keeps deeper items nested under the current indentation context", () => {
    const input = "1. Root\n    1.1. A\n  1.2. B\n    1.2.1. C";
    expect(renumberText(input)).toBe(
      "1. Root\n  1.1. A\n  1.2. B\n    1.2.1. C",
    );
  });
});

describe("fenced code blocks", () => {
  it("does not handle Enter on prefix-like text inside a backtick fence", () => {
    const input = "```text\n0.1.0. code\n```";
    const cursor = input.indexOf("0.1.0. code") + "0.1.0. code".length;
    expect(transformEnter(input, { anchor: cursor, head: cursor })).toBeNull();
    expect(transformIndent(input, { anchor: cursor, head: cursor }, "indent")).toBeNull();
    expect(transformIndent(input, { anchor: cursor, head: cursor }, "outdent")).toBeNull();
  });

  it("does not renumber prefix-like text inside fenced code", () => {
    const input = "9. Before\n```text\n0.1.0. code\n```\n8. After";
    expect(renumberText(input)).toBe(
      "1. Before\n```text\n0.1.0. code\n```\n2. After",
    );
  });

  it("does not insert, delete, or renumber numbering inside a fence", () => {
    const plain = "```text\nalpha\nbeta\n```";
    const plainStart = plain.indexOf("alpha");
    const plainEnd = plain.indexOf("beta") + "beta".length;
    expect(transformInsertNumbering(plain, { anchor: plainStart, head: plainEnd })).toBeNull();

    const numbered = "```text\n0.1.0. code\n```";
    const lineStart = numbered.indexOf("0.1.0. code");
    const lineEnd = lineStart + "0.1.0. code".length;
    expect(transformDeleteNumbering(numbered, { anchor: lineStart, head: lineEnd })).toBeNull();
    expect(transformRenumber(numbered, { anchor: lineStart, head: lineEnd })).toBeNull();
  });

  it("supports language info strings and tilde fences", () => {
    const backticks = "```typescript\n0.1.0. code\n```";
    const backtickCursor = backticks.indexOf("0.1.0. code") + "0.1.0. code".length;
    expect(transformEnter(backticks, { anchor: backtickCursor, head: backtickCursor })).toBeNull();

    const tildes = "~~~python\n0.1.0. code\n~~~";
    const tildeCursor = tildes.indexOf("0.1.0. code") + "0.1.0. code".length;
    expect(transformEnter(tildes, { anchor: tildeCursor, head: tildeCursor })).toBeNull();
    expect(renumberText(tildes)).toBe(tildes);
  });

  it("keeps numbering continuous across fenced code", () => {
    const input = "9. Before\n```\n0.1.0. code\n```\n8. After";
    expect(renumberText(input)).toBe("1. Before\n```\n0.1.0. code\n```\n2. After");
  });
});

describe("numbering continuity across fenced code", () => {
  it("continues 14 to 15 after a fenced code block", () => {
    const before = Array.from(
      { length: 14 },
      (_, index) => `${index + 1}. Item ${index + 1}`,
    ).join("\n");
    const input = [
      before,
      "",
      "```text",
      "code",
      "```",
      "",
      "15. After fence",
      "16. Next",
      "17. Last",
    ].join("\n");

    expect(renumberText(input)).toBe(input);
  });

  it("Enter after 17 creates 18 without resetting the post-fence sequence", () => {
    const before = Array.from(
      { length: 14 },
      (_, index) => `${index + 1}. Item ${index + 1}`,
    ).join("\n");
    const input = [
      before,
      "",
      "```text",
      "code",
      "```",
      "",
      "15. After fence",
      "16. Next",
      "17. Last",
    ].join("\n");

    const result = transformEnter(input, { anchor: input.length, head: input.length });

    expect(result?.text).toBe(`${input}\n18. `);
  });

  it("Tab on the new 18 turns it into 17.1 without renumbering 15-17", () => {
    const before = Array.from(
      { length: 14 },
      (_, index) => `${index + 1}. Item ${index + 1}`,
    ).join("\n");
    const input = [
      before,
      "",
      "```text",
      "0.1.0. code",
      "```",
      "",
      "15. After fence",
      "16. Next",
      "17. Last",
    ].join("\n");

    const entered = transformEnter(input, { anchor: input.length, head: input.length });
    expect(entered?.text).toBe(`${input}\n18. `);

    const indented = entered &&
      transformIndent(entered.text, entered.selection, "indent");

    expect(indented?.text).toBe(`${input}\n  17.1. `);
  });

  it("a normal unnumbered line still breaks numbering continuity", () => {
    expect(renumberText("9. Before\nplain text\n8. After")).toBe(
      "1. Before\nplain text\n1. After",
    );
  });
});
