import { parseNumberedLine } from "./model";

export const NUMBERED_LINE_TAB_SIZE = 2;

export interface NumberedLineHangingParts {
  sourceIndentText: string;
  visualIndentColumns: number;
  markerText: string;
  markerFrom: number;
  markerTo: number;
}

export interface HangingIndentGeometry {
  contentIndent: number;
  firstLineTextIndent: number;
}

export function numberedLineHangingParts(
  line: string,
): NumberedLineHangingParts | null {
  const parsed = parseNumberedLine(line);
  if (!parsed) {
    return null;
  }

  const depth = parsed.segments.length - 1;

  return {
    sourceIndentText: parsed.indent,
    visualIndentColumns: depth * NUMBERED_LINE_TAB_SIZE,
    markerText: `${parsed.number}${parsed.separator}`,
    markerFrom: parsed.indent.length,
    markerTo: parsed.contentStart,
  };
}

export function hangingIndentGeometry(
  sourceIndentWidth: number,
  markerWidth: number,
): HangingIndentGeometry {
  const safeSourceIndentWidth = Number.isFinite(sourceIndentWidth)
    ? Math.max(0, sourceIndentWidth)
    : 0;
  const safeMarkerWidth = Number.isFinite(markerWidth)
    ? Math.max(0, markerWidth)
    : 0;
  const contentIndent = safeSourceIndentWidth + safeMarkerWidth;

  return {
    contentIndent,
    firstLineTextIndent: -contentIndent,
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
