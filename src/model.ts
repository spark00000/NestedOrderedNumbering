export const NUMBERED_LINE_RE = /^([ \t]*)(\d+(?:\.\d+)*\.)([ \t]+)(.*)$/;

export interface ParsedNumberedLine {
  indent: string;
  number: string;
  segments: number[];
  separator: string;
  content: string;
  contentStart: number;
}

export interface TextSelection {
  anchor: number;
  head: number;
}

export interface TransformResult {
  text: string;
  selection: TextSelection;
}

export interface LinePosition {
  line: number;
  ch: number;
}

export interface MinimalChange {
  from: number;
  to: number;
  insert: string;
}

const TAB_WIDTH = 4;
const HIERARCHY_INDENT = "  ";

export function parseNumberedLine(line: string): ParsedNumberedLine | null {
  const match = NUMBERED_LINE_RE.exec(line);
  if (!match) {
    return null;
  }
  const [, indent, number, separator, content] = match;
  return {
    indent,
    number,
    segments: number.slice(0, -1).split(".").map(Number),
    separator,
    content,
    contentStart: indent.length + number.length + separator.length,
  };
}

export function positionToOffset(text: string, position: LinePosition): number {
  const lines = text.split("\n");
  const line = clamp(position.line, 0, Math.max(0, lines.length - 1));
  let offset = 0;
  for (let index = 0; index < line; index += 1) {
    offset += lines[index].length + 1;
  }
  return offset + clamp(position.ch, 0, lines[line].length);
}

export function offsetToPosition(text: string, offset: number): LinePosition {
  const safeOffset = clamp(offset, 0, text.length);
  const lines = text.split("\n");
  let consumed = 0;
  for (let line = 0; line < lines.length; line += 1) {
    const lineEnd = consumed + lines[line].length;
    if (safeOffset <= lineEnd || line === lines.length - 1) {
      return { line, ch: safeOffset - consumed };
    }
    consumed = lineEnd + 1;
  }
  return { line: 0, ch: 0 };
}

export function minimalChange(before: string, after: string): MinimalChange {
  let from = 0;
  const shortest = Math.min(before.length, after.length);
  while (from < shortest && before[from] === after[from]) {
    from += 1;
  }

  let beforeEnd = before.length;
  let afterEnd = after.length;
  while (
    beforeEnd > from &&
    afterEnd > from &&
    before[beforeEnd - 1] === after[afterEnd - 1]
  ) {
    beforeEnd -= 1;
    afterEnd -= 1;
  }
  return { from, to: beforeEnd, insert: after.slice(from, afterEnd) };
}

export function renumberText(text: string, touchStart = 0, touchEnd = Number.MAX_SAFE_INTEGER): string {
  const lines = text.split("\n");
  renumberLines(lines, touchStart, touchEnd);
  return lines.join("\n");
}

export function transformEnter(text: string, selection: TextSelection): TransformResult | null {
  if (selection.anchor !== selection.head) {
    return null;
  }
  const position = offsetToPosition(text, selection.head);
  const lines = text.split("\n");
  const parsed = parseNumberedLine(lines[position.line]);
  if (!parsed || position.ch < parsed.contentStart) {
    return null;
  }

  if (parsed.content.trim().length === 0) {
    const rawLines = [...lines];
    rawLines[position.line] = "";
    renumberLines(rawLines, position.line, position.line);
    const resultText = rawLines.join("\n");
    const cursor = positionToOffset(resultText, { line: position.line, ch: 0 });
    return { text: resultText, selection: { anchor: cursor, head: cursor } };
  }

  const placeholder = `${parsed.segments.map(() => "0").join(".")}.`;
  const insertion = `\n${parsed.indent}${placeholder} `;
  const rawText = `${text.slice(0, selection.head)}${insertion}${text.slice(selection.head)}`;
  const rawLines = rawText.split("\n");
  renumberLines(rawLines, position.line, position.line + 1);
  const resultText = rawLines.join("\n");
  const nextLine = parseNumberedLine(rawLines[position.line + 1]);
  if (!nextLine) {
    return null;
  }
  const cursor = positionToOffset(resultText, {
    line: position.line + 1,
    ch: nextLine.contentStart,
  });
  return { text: resultText, selection: { anchor: cursor, head: cursor } };
}

export function transformIndent(
  text: string,
  selection: TextSelection,
  direction: "indent" | "outdent",
): TransformResult | null {
  const oldLines = text.split("\n");
  const selected = selectedLineBounds(text, selection);
  const numberedLines: number[] = [];
  for (let line = selected.start; line <= selected.end; line += 1) {
    if (parseNumberedLine(oldLines[line])) {
      numberedLines.push(line);
    }
  }
  if (numberedLines.length === 0) {
    return null;
  }

  const first = numberedLines[0];
  let last = numberedLines[numberedLines.length - 1];
  const lastParsed = parseNumberedLine(oldLines[last]);
  if (!lastParsed) {
    return null;
  }
  const subtreeIndent = indentationColumns(lastParsed.indent);
  for (let line = last + 1; line < oldLines.length; line += 1) {
    if (isBlankLine(oldLines[line])) {
      continue;
    }
    const parsed = parseNumberedLine(oldLines[line]);
    if (!parsed || indentationColumns(parsed.indent) <= subtreeIndent) {
      break;
    }
    last = line;
  }

  const bounds = numberedBlockBounds(oldLines, first);
  const indentToken = detectIndentToken(oldLines, bounds.start, bounds.end);
  const firstParsed = parseNumberedLine(oldLines[first]);
  if (!firstParsed) {
    return null;
  }

  if (direction === "indent") {
    const currentColumns = indentationColumns(firstParsed.indent);
    let hasPreviousSibling = false;
    for (let line = first - 1; line >= bounds.start; line -= 1) {
      if (isBlankLine(oldLines[line])) {
        continue;
      }
      const parsed = parseNumberedLine(oldLines[line]);
      if (!parsed) {
        break;
      }
      const columns = indentationColumns(parsed.indent);
      if (columns === currentColumns) {
        hasPreviousSibling = true;
        break;
      }
      if (columns < currentColumns) {
        break;
      }
    }
    if (!hasPreviousSibling) {
      return null;
    }
  }

  const rawLines = [...oldLines];
  for (let line = first; line <= last; line += 1) {
    const parsed = parseNumberedLine(rawLines[line]);
    if (!parsed) {
      continue;
    }
    if (direction === "indent") {
      rawLines[line] = `${indentToken}${rawLines[line]}`;
    } else if (parsed.indent.length === 0) {
      rawLines[line] = parsed.content;
    } else {
      rawLines[line] = removeIndent(rawLines[line], parsed.indent, indentToken);
    }
  }

  renumberLines(rawLines, Math.max(0, first - 1), Math.min(rawLines.length - 1, last + 1));
  const resultText = rawLines.join("\n");
  if (resultText === text) {
    return null;
  }
  return { text: resultText, selection: mapSelectionByContent(text, resultText, selection) };
}

export function transformInsertNumbering(text: string, selection: TextSelection): TransformResult | null {
  const oldLines = text.split("\n");
  const rawLines = [...oldLines];
  const selected = selectedLineBounds(text, selection);
  let inserted = false;
  for (let line = selected.start; line <= selected.end; line += 1) {
    const current = rawLines[line];
    if (parseNumberedLine(current) || isBlankLine(current)) {
      continue;
    }
    const indent = /^([ \t]*)/.exec(current)?.[1] ?? "";
    rawLines[line] = `${indent}0. ${current.slice(indent.length)}`;
    inserted = true;
  }
  if (!inserted) {
    return null;
  }
  renumberLines(rawLines, Math.max(0, selected.start - 1), Math.min(rawLines.length - 1, selected.end + 1));
  const resultText = rawLines.join("\n");
  return { text: resultText, selection: mapSelectionByContent(text, resultText, selection) };
}

export function transformDeleteNumbering(text: string, selection: TextSelection): TransformResult | null {
  const oldLines = text.split("\n");
  const rawLines = [...oldLines];
  const selected = selectedLineBounds(text, selection);
  let removed = false;
  for (let line = selected.start; line <= selected.end; line += 1) {
    const parsed = parseNumberedLine(rawLines[line]);
    if (!parsed) {
      continue;
    }
    rawLines[line] = `${parsed.indent}${parsed.content}`;
    removed = true;
  }
  if (!removed) {
    return null;
  }
  renumberLines(rawLines, Math.max(0, selected.start - 1), Math.min(rawLines.length - 1, selected.end + 1));
  const resultText = rawLines.join("\n");
  return { text: resultText, selection: mapSelectionByContent(text, resultText, selection) };
}

export function transformRenumber(text: string, selection: TextSelection): TransformResult | null {
  const selected = selectedLineBounds(text, selection);
  const resultText = renumberText(text, selected.start, selected.end);
  if (resultText === text) {
    return null;
  }
  return { text: resultText, selection: mapSelectionByContent(text, resultText, selection) };
}

function selectedLineBounds(text: string, selection: TextSelection): { start: number; end: number } {
  const fromOffset = Math.min(selection.anchor, selection.head);
  const toOffset = Math.max(selection.anchor, selection.head);
  const from = offsetToPosition(text, fromOffset);
  const to = offsetToPosition(text, toOffset);
  let end = to.line;
  if (toOffset > fromOffset && to.ch === 0 && to.line > from.line) {
    end -= 1;
  }
  return { start: from.line, end: Math.max(from.line, end) };
}

function renumberLines(lines: string[], touchStart: number, touchEnd: number): void {
  let line = 0;
  while (line < lines.length) {
    if (!parseNumberedLine(lines[line])) {
      line += 1;
      continue;
    }
    const blockStart = line;
    let blockEnd = line;
    let scan = line + 1;
    while (scan < lines.length) {
      if (parseNumberedLine(lines[scan])) {
        blockEnd = scan;
        scan += 1;
        continue;
      }
      if (isBlankLine(lines[scan])) {
        scan += 1;
        continue;
      }
      break;
    }
    if (blockEnd >= touchStart && blockStart <= touchEnd) {
      renumberBlock(lines, blockStart, blockEnd);
    }
    line = scan;
  }
}

function renumberBlock(lines: string[], start: number, end: number): void {
  const entries: Array<{ line: number; parsed: ParsedNumberedLine; columns: number }> = [];
  for (let line = start; line <= end; line += 1) {
    const parsed = parseNumberedLine(lines[line]);
    if (parsed) {
      entries.push({ line, parsed, columns: indentationColumns(parsed.indent) });
    }
  }
  if (entries.length === 0) {
    return;
  }

  const columns = entries.map((entry) => entry.columns);
  const base = Math.min(...columns);
  const baseIndex = columns.indexOf(base);
  const baseIndent = entries[baseIndex].parsed.indent;
  const depths = deriveDepths(columns, base);
  const counters: number[] = [];
  let previousDepth = 0;
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const item = entry.parsed;
    const depth = depths[index];
    if (depth > previousDepth) {
      while (counters.length <= depth) {
        counters.push(0);
      }
      counters[depth] = 1;
    } else {
      counters.length = depth + 1;
      counters[depth] = (counters[depth] ?? 0) + 1;
    }
    previousDepth = depth;
    // The numeric prefix grows by two characters per depth ("1." -> "1.1.").
    // Two leading spaces per depth therefore keep each item's content start on
    // a stable four-column rhythm instead of moving six columns per level.
    const normalizedIndent = `${baseIndent}${HIERARCHY_INDENT.repeat(depth)}`;
    lines[entry.line] = `${normalizedIndent}${counters.join(".")}. ${item.content}`;
  }
}

// Derive hierarchy depths from the relative ordering of indentation columns
// rather than absolute column/unit arithmetic. A stack holds the currently
// open indentation context: each open column stays on the stack until a later
// line is at or above that column, so a shallower line closes the deeper
// context it no longer belongs to. The base column is depth 0; a deeper line
// hangs one level beneath the most recent shallower column still open. This
// stays correct even when indentation widths are inconsistent.
function deriveDepths(columns: number[], base: number): number[] {
  const depths: number[] = [];
  const stack: Array<{ column: number; depth: number }> = [];
  for (let index = 0; index < columns.length; index += 1) {
    const column = columns[index];
    if (stack.length === 0 || column <= base) {
      stack.length = 0;
      depths.push(0);
      stack.push({ column, depth: 0 });
      continue;
    }
    while (stack.length > 0 && stack[stack.length - 1].column >= column) {
      stack.pop();
    }
    const depth = stack.length > 0 ? stack[stack.length - 1].depth + 1 : 0;
    depths.push(depth);
    stack.push({ column, depth });
  }
  return depths;
}

function numberedBlockBounds(lines: string[], line: number): { start: number; end: number } {
  let start = line;
  let end = line;
  while (start > 0) {
    let candidate = start - 1;
    while (candidate >= 0 && isBlankLine(lines[candidate])) {
      candidate -= 1;
    }
    if (candidate < 0 || !parseNumberedLine(lines[candidate])) {
      break;
    }
    start = candidate;
  }
  while (end + 1 < lines.length) {
    let candidate = end + 1;
    while (candidate < lines.length && isBlankLine(lines[candidate])) {
      candidate += 1;
    }
    if (candidate >= lines.length || !parseNumberedLine(lines[candidate])) {
      break;
    }
    end = candidate;
  }
  return { start, end };
}

function isBlankLine(line: string): boolean {
  return line.trim().length === 0;
}

function detectIndentToken(lines: string[], start: number, end: number): string {
  const indents: string[] = [];
  const columns: number[] = [];
  for (let line = start; line <= end; line += 1) {
    const parsed = parseNumberedLine(lines[line]);
    if (parsed) {
      indents.push(parsed.indent);
      columns.push(indentationColumns(parsed.indent));
    }
  }
  const usesOnlyTabs = indents.some((indent) => indent.includes("\t")) &&
    !indents.some((indent) => indent.includes(" "));
  if (usesOnlyTabs) {
    return "\t";
  }
  const base = columns.length > 0 ? Math.min(...columns) : 0;
  return " ".repeat(detectIndentWidth(columns, base));
}

function detectIndentWidth(columns: number[], base: number): number {
  let unit = 0;
  for (const column of columns) {
    const delta = column - base;
    if (delta > 0) {
      unit = greatestCommonDivisor(unit, delta);
    }
  }
  return unit > 0 && unit <= 8 ? unit : HIERARCHY_INDENT.length;
}

function indentationColumns(indent: string): number {
  let columns = 0;
  for (const character of indent) {
    columns += character === "\t"
      ? TAB_WIDTH - (columns % TAB_WIDTH)
      : 1;
  }
  return columns;
}

function removeIndent(line: string, indent: string, indentToken: string): string {
  if (indent.startsWith("\t")) {
    return line.slice(1);
  }
  const width = indentToken === "\t" ? TAB_WIDTH : indentToken.length;
  let remove = 0;
  while (remove < indent.length && remove < width && indent[remove] === " ") {
    remove += 1;
  }
  return line.slice(remove);
}

function mapSelectionByContent(before: string, after: string, selection: TextSelection): TextSelection {
  return {
    anchor: mapEndpointByContent(before, after, selection.anchor),
    head: mapEndpointByContent(before, after, selection.head),
  };
}

function mapEndpointByContent(before: string, after: string, offset: number): number {
  const oldPosition = offsetToPosition(before, offset);
  const oldLines = before.split("\n");
  const newLines = after.split("\n");
  const oldLine = oldLines[oldPosition.line] ?? "";
  const newLine = newLines[oldPosition.line] ?? "";
  const oldParsed = parseNumberedLine(oldLine);
  const newParsed = parseNumberedLine(newLine);
  const oldIndent = /^([ \t]*)/.exec(oldLine)?.[1] ?? "";
  const newIndent = /^([ \t]*)/.exec(newLine)?.[1] ?? "";
  const oldContentStart = oldParsed?.contentStart ?? oldIndent.length;
  const newContentStart = newParsed?.contentStart ?? newIndent.length;
  const ch = oldPosition.ch >= oldContentStart
    ? newContentStart + (oldPosition.ch - oldContentStart)
    : clamp(oldPosition.ch + (newIndent.length - oldIndent.length), 0, newContentStart);
  return positionToOffset(after, { line: oldPosition.line, ch });
}

function greatestCommonDivisor(left: number, right: number): number {
  let a = Math.abs(left);
  let b = Math.abs(right);
  while (b !== 0) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
