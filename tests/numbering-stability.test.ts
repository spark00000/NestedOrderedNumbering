import { describe, expect, it } from "vitest";
import { transformIndent } from "../src/fenced-code-model";

function cursorAt(text: string, needle: string): number {
  const index = text.indexOf(needle);
  if (index < 0) throw new Error(`needle not found: ${needle}`);
  return index + needle.length;
}

describe("numbering stability during indent", () => {
  it("preserves a non-1 root sequence when the next root becomes a child", () => {
    const input = [
      "9. xxx",
      "  9.1. xxx",
      "    9.1.1. xxx",
      "10. 가나다",
      "11. 111111",
      "12. ",
    ].join("\n");

    const cursor = cursorAt(input, "12. ");
    const result = transformIndent(input, { anchor: cursor, head: cursor }, "indent");

    expect(result?.text).toBe([
      "9. xxx",
      "  9.1. xxx",
      "    9.1.1. xxx",
      "10. 가나다",
      "11. 111111",
      "  11.1. ",
    ].join("\n"));
  });

  it("refuses to indent the only child again when it has no previous sibling under the same parent", () => {
    const input = [
      "9. xxx",
      "  9.1. xxx",
      "    9.1.1. xxx",
      "10. 가나다",
      "11. 111111",
      "  11.1. ",
    ].join("\n");

    const cursor = cursorAt(input, "11.1. ");
    const result = transformIndent(input, { anchor: cursor, head: cursor }, "indent");

    expect(result).toBeNull();
  });
});
