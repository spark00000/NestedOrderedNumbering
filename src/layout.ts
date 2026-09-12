import { parseNumberedLine } from "./model";

export const NUMBERED_LINE_TAB_SIZE = 2;

export function numberedLineHangingPrefixText(line: string): string | null {
  const parsed = parseNumberedLine(line);
  if (!parsed || parsed.segments.length < 2) {
    return null;
  }
  return `${parsed.indent}${parsed.number}${parsed.separator}`;
}

export function expandTabs(
  text: string,
  tabSize = NUMBERED_LINE_TAB_SIZE,
): string {
  let column = 0;
  let result = "";
  for (const char of text) {
    if (char === "\t") {
      const remainder = column % tabSize;
      const spaces = remainder === 0 ? tabSize : tabSize - remainder;
      result += " ".repeat(spaces);
      column += spaces;
    } else {
      result += char;
      column += 1;
    }
  }
  return result;
}
