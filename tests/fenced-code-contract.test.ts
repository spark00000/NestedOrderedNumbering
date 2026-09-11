import { describe, expect, it } from "vitest";
import {
  renumberText,
  transformEnter,
  transformIndent,
} from "../src/fenced-code-model";

describe("fenced-code runtime contract", () => {
  it("preserves an explicit sequence start across a fenced block", () => {
    const input = [
      "5. TEST",
      "",
      "```",
      "test",
      "```",
      "6. AFTER",
    ].join("\n");

    const entered = transformEnter(input, {
      anchor: input.length,
      head: input.length,
    });
    expect(entered?.text).toBe(`${input}\n7. `);

    const indented = entered &&
      transformIndent(entered.text, entered.selection, "indent");
    expect(indented?.text).toBe(`${input}\n  6.1. `);
  });

  it("keeps the canonical 1-2-3 -> code -> 4 sequence continuous", () => {
    const input = [
      "1. TEST1",
      "2. TEST2",
      "3. TEST3",
      "```",
      "1. code literal",
      "2. code literal",
      "3. code literal",
      "```",
      "4. TEST4",
    ].join("\n");

    expect(renumberText(input)).toBe(input);
    const entered = transformEnter(input, {
      anchor: input.length,
      head: input.length,
    });
    expect(entered?.text).toBe(`${input}\n5. `);
  });

  it("never handles 1.1.-like content inside fenced code", () => {
    const input = [
      "5. TEST",
      "",
      "```",
      "1.1. code literal",
    ].join("\n");
    const cursor = input.length;

    expect(transformEnter(input, { anchor: cursor, head: cursor })).toBeNull();
    expect(
      transformIndent(input, { anchor: cursor, head: cursor }, "indent"),
    ).toBeNull();
    expect(
      transformIndent(input, { anchor: cursor, head: cursor }, "outdent"),
    ).toBeNull();
  });
});
