import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  transformEnter,
  transformIndent,
} from "../src/fenced-code-model";

function vector(name: string): string {
  const raw = readFileSync(new URL(name, import.meta.url), "utf8");
  const start = "<!-- TEST-DOCUMENT-START -->\n";
  const end = "\n<!-- TEST-DOCUMENT-END -->";
  const from = raw.indexOf(start);
  const to = raw.indexOf(end);
  if (from < 0 || to < 0 || to < from) {
    throw new Error(`Malformed Markdown test vector: ${name}`);
  }
  return raw.slice(from + start.length, to);
}

describe("Markdown test vectors", () => {
  it("vector 01: fenced code is plugin-inert", () => {
    const input = vector("vector-01-fenced-code-inert.md");
    const needle = "1.1. literal code";
    const cursor = input.indexOf(needle) + needle.length;

    expect(cursor).toBeGreaterThan(needle.length - 1);
    expect(transformEnter(input, { anchor: cursor, head: cursor })).toBeNull();
    expect(
      transformIndent(input, { anchor: cursor, head: cursor }, "indent"),
    ).toBeNull();
    expect(
      transformIndent(input, { anchor: cursor, head: cursor }, "outdent"),
    ).toBeNull();
  });

  it("vector 02: 1-2-3 -> fenced code -> 4 continues to 5 and 4.1", () => {
    const input = vector("vector-02-fenced-code-continuity.md");
    const entered = transformEnter(input, {
      anchor: input.length,
      head: input.length,
    });

    expect(entered?.text).toBe(`${input}\n5. `);
    const indented = entered &&
      transformIndent(entered.text, entered.selection, "indent");
    expect(indented?.text).toBe(`${input}\n  4.1. `);
  });

  it("vector 03: 5 -> fenced code -> 6 continues to 7 and 6.1", () => {
    const input = vector("vector-03-non1-start-continuity.md");
    const entered = transformEnter(input, {
      anchor: input.length,
      head: input.length,
    });

    expect(entered?.text).toBe(`${input}\n7. `);
    const indented = entered &&
      transformIndent(entered.text, entered.selection, "indent");
    expect(indented?.text).toBe(`${input}\n  6.1. `);
  });

  it("vector 04: nested sequence continues from 1.2 to 1.3 across fenced code", () => {
    const input = vector("vector-04-nested-continuity.md");
    const entered = transformEnter(input, {
      anchor: input.length,
      head: input.length,
    });

    expect(entered?.text).toBe(`${input}\n  1.3. `);
  });
});
