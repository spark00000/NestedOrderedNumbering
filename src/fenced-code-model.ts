import {
  fencedCodeLineMask,
  offsetToPosition,
  parseNumberedLine,
  transformDeleteNumbering as coreTransformDeleteNumbering,
  transformEnter as coreTransformEnter,
  transformIndent as coreTransformIndent,
  transformInsertNumbering as coreTransformInsertNumbering,
  transformRenumber as coreTransformRenumber,
  type TextSelection,
  type TransformResult,
} from "./model";

export * from "./model";

type Transform = (text: string, selection: TextSelection) => TransformResult | null;

export function isOffsetInFencedCode(text: string, offset: number): boolean {
  const position = offsetToPosition(text, offset);
  return fencedCodeLineMask(text.split("\n"))[position.line] ?? false;
}

export function transformEnter(
  text: string,
  selection: TextSelection,
): TransformResult | null {
  return applyFencedCodeContract(text, selection, coreTransformEnter);
}

export function transformIndent(
  text: string,
  selection: TextSelection,
  direction: "indent" | "outdent",
): TransformResult | null {
  return applyFencedCodeContract(
    text,
    selection,
    (value, range) => coreTransformIndent(value, range, direction),
  );
}

export function transformInsertNumbering(
  text: string,
  selection: TextSelection,
): TransformResult | null {
  return applyFencedCodeContract(text, selection, coreTransformInsertNumbering);
}

export function transformDeleteNumbering(
  text: string,
  selection: TextSelection,
): TransformResult | null {
  return applyFencedCodeContract(text, selection, coreTransformDeleteNumbering);
}

export function transformRenumber(
  text: string,
  selection: TextSelection,
): TransformResult | null {
  return applyFencedCodeContract(text, selection, coreTransformRenumber);
}

function applyFencedCodeContract(
  text: string,
  selection: TextSelection,
  transform: Transform,
): TransformResult | null {
  if (selectionTouchesFencedCode(text, selection)) {
    return null;
  }

  const start = logicalBlockStart(text, selection.head);
  const firstRoot = start === null ? null : rootNumberAtLine(text, start);
  const result = transform(text, selection);
  if (!result || start === null || firstRoot === null || firstRoot === 1) {
    return result;
  }

  const shiftedText = restoreRootStart(result.text, start, firstRoot);
  if (shiftedText === result.text) {
    return result;
  }

  const delta = shiftedText.length - result.text.length;
  return {
    text: shiftedText,
    selection: {
      anchor: result.selection.anchor + delta,
      head: result.selection.head + delta,
    },
  };
}

function selectionTouchesFencedCode(text: string, selection: TextSelection): boolean {
  const lines = text.split("\n");
  const fenced = fencedCodeLineMask(lines);
  const anchor = offsetToPosition(text, selection.anchor).line;
  const head = offsetToPosition(text, selection.head).line;
  const from = Math.min(anchor, head);
  const to = Math.max(anchor, head);
  for (let line = from; line <= to; line += 1) {
    if (fenced[line]) {
      return true;
    }
  }
  return false;
}

function logicalBlockStart(text: string, offset: number): number | null {
  const lines = text.split("\n");
  const fenced = fencedCodeLineMask(lines);
  let line = offsetToPosition(text, offset).line;

  while (line >= 0 && !parseNumberedLine(lines[line])) {
    if (!fenced[line] && lines[line].trim().length > 0) {
      return null;
    }
    line -= 1;
  }
  if (line < 0) {
    return null;
  }

  let start = line;
  for (let candidate = line - 1; candidate >= 0; candidate -= 1) {
    if (fenced[candidate] || lines[candidate].trim().length === 0) {
      continue;
    }
    if (!parseNumberedLine(lines[candidate])) {
      break;
    }
    start = candidate;
  }
  return start;
}

function rootNumberAtLine(text: string, line: number): number | null {
  return parseNumberedLine(text.split("\n")[line])?.segments[0] ?? null;
}

function restoreRootStart(text: string, start: number, firstRoot: number): string {
  const lines = text.split("\n");
  const fenced = fencedCodeLineMask(lines);
  const delta = firstRoot - 1;

  for (let line = start; line < lines.length; line += 1) {
    if (fenced[line] || lines[line].trim().length === 0) {
      continue;
    }
    const parsed = parseNumberedLine(lines[line]);
    if (!parsed) {
      break;
    }
    if (parsed.segments.length === 0) {
      continue;
    }
    const segments = [...parsed.segments];
    segments[0] += delta;
    lines[line] = `${parsed.indent}${segments.join(".")}. ${parsed.content}`;
  }

  return lines.join("\n");
}
