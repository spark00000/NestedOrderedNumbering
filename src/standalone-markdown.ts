import {
  type TextSelection,
  type TransformResult,
  fencedCodeLineMask,
  offsetToPosition,
  parseNumberedLine,
  positionToOffset,
  renumberText,
} from "./model";

export function transformStandaloneMarkdownStart(
  text: string,
  selection: TextSelection,
): TransformResult | null {
  if (selection.anchor !== selection.head) {
    return null;
  }

  const position = offsetToPosition(text, selection.head);
  const lines = text.split("\n");
  const fencedLines = fencedCodeLineMask(lines);
  if (fencedLines[position.line]) {
    return null;
  }

  const parsed = parseNumberedLine(lines[position.line]);
  if (
    !parsed ||
    position.ch < parsed.contentStart ||
    !isStandaloneMarkdownStart(parsed.content)
  ) {
    return null;
  }

  const rawLines = [...lines];
  rawLines[position.line] = parsed.content;
  const rawText = rawLines.join("\n");
  const resultText = renumberText(
    rawText,
    Math.max(0, position.line - 1),
    Math.min(rawLines.length - 1, position.line + 1),
  );
  const resultLines = resultText.split("\n");
  const contentOffset = Math.max(0, position.ch - parsed.contentStart);
  const cursor = positionToOffset(resultText, {
    line: position.line,
    ch: Math.min(contentOffset, resultLines[position.line]?.length ?? 0),
  });

  return {
    text: resultText,
    selection: { anchor: cursor, head: cursor },
  };
}

function isStandaloneMarkdownStart(content: string): boolean {
  return /^(?:`{3,}|~{3,})/.test(content) ||
    /^#{1,6}(?:[ \t]+|$)/.test(content) ||
    /^>[ \t]+/.test(content) ||
    /^[-+*][ \t]+/.test(content);
}
