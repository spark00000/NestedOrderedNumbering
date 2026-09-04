import { EditorSelection, Prec, RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  keymap,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view";
import {
  type Editor,
  type EditorPosition,
  MarkdownView,
  Plugin,
} from "obsidian";
import {
  type TextSelection,
  type TransformResult,
  minimalChange,
  offsetToPosition,
  parseNumberedLine,
  positionToOffset,
  transformDeleteNumbering,
  transformEnter,
  transformIndent,
  transformInsertNumbering,
  transformRenumber,
} from "./model";

type Transformer = (text: string, selection: TextSelection) => TransformResult | null;

const NUMBERED_LINE_CLASS = "nested-ordered-numbering-line";
const numberedLineDecoration = Decoration.line({
  attributes: { class: NUMBERED_LINE_CLASS },
});

const numberedLineViewPlugin = ViewPlugin.fromClass(class {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = buildNumberedLineDecorations(view);
  }

  update(update: ViewUpdate): void {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = buildNumberedLineDecorations(update.view);
    }
  }
}, {
  decorations: (plugin) => plugin.decorations,
});

export default class NestedOrderedNumberingPlugin extends Plugin {
  onload(): void {
    const captureHandler = (event: KeyboardEvent): void => this.handlePriorityKeydown(event);
    // Capture-phase document handler wins over Outliner and other editor keymaps;
    // the CodeMirror Prec.highest keymap below is the fallback for the same keys.
    document.addEventListener("keydown", captureHandler, true);
    this.register(() => document.removeEventListener("keydown", captureHandler, true));

    this.registerEditorExtension(
      Prec.highest(
        keymap.of([
          { key: "Enter", run: (view) => applyViewTransform(view, transformEnter) },
          {
            key: "Tab",
            run: (view) => applyViewTransform(
              view,
              (text, selection) => transformIndent(text, selection, "indent"),
            ),
          },
          {
            key: "Shift-Tab",
            run: (view) => applyViewTransform(
              view,
              (text, selection) => transformIndent(text, selection, "outdent"),
            ),
          },
        ]),
      ),
    );
    this.registerEditorExtension(numberedLineViewPlugin);

    this.addEditorCommand(
      "insert-numbering",
      "Insert nested ordered numbering",
      transformInsertNumbering,
    );
    this.addEditorCommand(
      "delete-numbering",
      "Delete nested ordered numbering",
      transformDeleteNumbering,
    );
    this.addEditorCommand(
      "renumber-block",
      "Renumber nested ordered block",
      transformRenumber,
    );

  }

  private handlePriorityKeydown(event: KeyboardEvent): void {
    if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    if (event.key !== "Enter" && event.key !== "Tab") {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (!target?.closest?.(".cm-editor")) {
      return;
    }

    const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!markdownView) {
      return;
    }

    const transformer: Transformer = event.key === "Enter"
      ? transformEnter
      : (text, selection) => transformIndent(
        text,
        selection,
        event.shiftKey ? "outdent" : "indent",
      );

    if (!applyEditorTransform(markdownView.editor, transformer)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  private addEditorCommand(
    id: string,
    name: string,
    transformer: Transformer,
  ): void {
    this.addCommand({
      id,
      name,
      editorCheckCallback: (checking, editor) => {
        const text = editor.getValue();
        const selection = editorSelection(editor, text);
        const result = transformer(text, selection);
        if (!result) {
          return false;
        }
        if (!checking) {
          applyEditorResult(editor, text, result);
        }
        return true;
      },
    });
  }
}

function buildNumberedLineDecorations(view: EditorView): DecorationSet {
  const lineStarts = new Set<number>();
  for (const range of view.visibleRanges) {
    let position = range.from;
    while (position <= range.to) {
      const line = view.state.doc.lineAt(position);
      if (parseNumberedLine(line.text)) {
        lineStarts.add(line.from);
      }
      if (line.to >= range.to) {
        break;
      }
      position = line.to + 1;
    }
  }

  const builder = new RangeSetBuilder<Decoration>();
  for (const lineStart of [...lineStarts].sort((left, right) => left - right)) {
    builder.add(lineStart, lineStart, numberedLineDecoration);
  }
  return builder.finish();
}

function applyViewTransform(view: EditorView, transformer: Transformer): boolean {
  if (view.state.selection.ranges.length !== 1) {
    return false;
  }
  const text = view.state.doc.toString();
  const main = view.state.selection.main;
  const result = transformer(text, { anchor: main.anchor, head: main.head });
  if (!result || result.text === text) {
    return false;
  }
  const change = minimalChange(text, result.text);
  view.dispatch({
    changes: { from: change.from, to: change.to, insert: change.insert },
    selection: EditorSelection.range(result.selection.anchor, result.selection.head),
    scrollIntoView: true,
    userEvent: "input.nested-ordered-numbering",
  });
  return true;
}

function applyEditorTransform(editor: Editor, transformer: Transformer): boolean {
  const text = editor.getValue();
  const result = transformer(text, editorSelection(editor, text));
  if (!result || result.text === text) {
    return false;
  }
  applyEditorResult(editor, text, result);
  return true;
}

function editorSelection(editor: Editor, text: string): TextSelection {
  return {
    anchor: positionToOffset(text, editor.getCursor("anchor")),
    head: positionToOffset(text, editor.getCursor("head")),
  };
}

function applyEditorResult(editor: Editor, before: string, result: TransformResult): void {
  const change = minimalChange(before, result.text);
  const from = asEditorPosition(offsetToPosition(before, change.from));
  const to = asEditorPosition(offsetToPosition(before, change.to));
  const selectionFrom = asEditorPosition(offsetToPosition(
    result.text,
    Math.min(result.selection.anchor, result.selection.head),
  ));
  const selectionTo = asEditorPosition(offsetToPosition(
    result.text,
    Math.max(result.selection.anchor, result.selection.head),
  ));

  editor.transaction({
    changes: [{ from, to, text: change.insert }],
    selection: { from: selectionFrom, to: selectionTo },
  });
}

function asEditorPosition(position: { line: number; ch: number }): EditorPosition {
  return position;
}
