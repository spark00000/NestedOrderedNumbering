import { parseNumberedLine } from "./model";

export const NUMBERED_LINE_TAB_SIZE = 2;

export interface NumberedLineHangingParts {
  indentText: string;
  markerText: string;
  markerFrom: number;
  markerTo: number;
}

export function numberedLineHangingParts(
  line: string,
): NumberedLineHangingParts | null {
  const parsed = parseNumberedLine(line);
  if (!parsed || parsed.segments.length < 2) {
    return null;
  }

  return {
    indentText: parsed.indent,
    markerText: `${parsed.number}${parsed.separator}`,
    markerFrom: parsed.indent.length,
    markerTo: parsed.contentStart,
  };
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
