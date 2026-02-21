import type {
  MarkdownInlineToolbarAction,
  MarkdownSelection,
  MarkdownToolbarAction,
  MarkdownToolbarActionResult,
} from './markdownCore.types';

export const DEFAULT_MARKDOWN_FEATURES: MarkdownToolbarAction[] = [
  'bold',
  'italic',
  'strikethrough',
  'code',
  'codeBlock',
  'heading1',
  'heading2',
  'heading3',
  'heading4',
  'heading5',
  'heading6',
  'quote',
  'unorderedList',
  'orderedList',
  'divider',
  'image',
];

const INLINE_ACTION_MARKERS: Record<MarkdownInlineToolbarAction, { open: string; close: string }> = {
  bold: { open: '**', close: '**' },
  italic: { open: '_', close: '_' },
  strikethrough: { open: '~~', close: '~~' },
  code: { open: '`', close: '`' },
};

/** Parameters accepted by {@link applyMarkdownToolbarAction}. */
type ApplyMarkdownToolbarActionParams = {
  action: MarkdownToolbarAction;
  text: string;
  selection: MarkdownSelection;
  activeInlineActions?: MarkdownInlineToolbarAction[];
};

export function applyMarkdownToolbarAction({
  action,
  text,
  selection,
  activeInlineActions = [],
}: ApplyMarkdownToolbarActionParams): MarkdownToolbarActionResult {
  if (action === 'image') {
    return applyImageAction({ text, selection, activeInlineActions });
  }

  if (isInlineToolbarAction(action)) {
    return applyInlineAction({
      action,
      text,
      selection,
      activeInlineActions,
    });
  }

  return applyBlockAction({
    action,
    text,
    selection,
    activeInlineActions,
  });
}

/**
 * Wraps or unwraps the selected text (or inserts markers at cursor)
 * for an inline formatting action (bold, italic, strikethrough, code).
 */
function applyInlineAction({
  action,
  text,
  selection,
  activeInlineActions,
}: {
  action: MarkdownInlineToolbarAction;
  text: string;
  selection: MarkdownSelection;
  activeInlineActions: MarkdownInlineToolbarAction[];
}): MarkdownToolbarActionResult {
  const marker = INLINE_ACTION_MARKERS[action];
  if (!marker) {
    return {
      text,
      selection,
      activeInlineActions,
    };
  }

  if (selection.start !== selection.end) {
    const selectedText = text.slice(selection.start, selection.end);
    const nextText = `${text.slice(0, selection.start)}${marker.open}${selectedText}${marker.close}${text.slice(selection.end)}`;
    const markerSize = marker.open.length;

    return {
      text: nextText,
      selection: {
        start: selection.start + markerSize,
        end: selection.end + markerSize,
      },
      activeInlineActions: activeInlineActions.filter((value) => value !== action),
    };
  }

  const cursor = selection.start;
  const isActive = activeInlineActions.includes(action);
  const nextMarker = isActive ? marker.close : marker.open;
  const nextText = `${text.slice(0, cursor)}${nextMarker}${text.slice(cursor)}`;
  const nextSelection = {
    start: cursor + nextMarker.length,
    end: cursor + nextMarker.length,
  };
  const nextActiveInlineActions = isActive
    ? activeInlineActions.filter((value) => value !== action)
    : [...activeInlineActions, action];

  return {
    text: nextText,
    selection: nextSelection,
    activeInlineActions: nextActiveInlineActions,
  };
}

/**
 * Applies a block-level toolbar action (heading, quote, list, divider, code block).
 * Identifies the lines covered by the current selection and transforms them.
 */
function applyBlockAction({
  action,
  text,
  selection,
  activeInlineActions,
}: {
  action: Exclude<MarkdownToolbarAction, MarkdownInlineToolbarAction>;
  text: string;
  selection: MarkdownSelection;
  activeInlineActions: MarkdownInlineToolbarAction[];
}): MarkdownToolbarActionResult {
  const lineRange = getSelectedLineRange(text, selection);
  const lines = lineRange.content.split('\n');
  const nextLines = transformLinesByAction(action, lines);
  const nextContent = nextLines.join('\n');
  const nextText = `${text.slice(0, lineRange.start)}${nextContent}${text.slice(lineRange.end)}`;

  if (selection.start === selection.end) {
    const baseOffset = selection.start - lineRange.start;
    const nextOffset = Math.max(0, Math.min(nextContent.length, baseOffset + (nextContent.length - lineRange.content.length)));
    const cursor = lineRange.start + nextOffset;
    return {
      text: nextText,
      selection: { start: cursor, end: cursor },
      activeInlineActions,
    };
  }

  return {
    text: nextText,
    selection: {
      start: lineRange.start,
      end: lineRange.start + nextContent.length,
    },
    activeInlineActions,
  };
}

/** Dispatches per-action line transformations. */
function transformLinesByAction(
  action: Exclude<MarkdownToolbarAction, MarkdownInlineToolbarAction>,
  lines: string[]
): string[] {
  switch (action) {
    case 'heading':
      return togglePrefix(lines, /^#{1,6}\s+/, () => '# ');
    case 'heading1':
      return setHeadingLevel(lines, 1);
    case 'heading2':
      return setHeadingLevel(lines, 2);
    case 'heading3':
      return setHeadingLevel(lines, 3);
    case 'heading4':
      return setHeadingLevel(lines, 4);
    case 'heading5':
      return setHeadingLevel(lines, 5);
    case 'heading6':
      return setHeadingLevel(lines, 6);
    case 'quote':
      return togglePrefix(lines, /^>\s?/, () => '> ');
    case 'unorderedList':
      return togglePrefix(lines, /^[-*+]\s+/, () => '- ');
    case 'orderedList':
      return togglePrefix(lines, /^\d+\.\s+/, (index) => `${index + 1}. `);
    case 'divider':
      return lines.every((line) => /^ {0,3}([-*_])[ \t]*(?:\1[ \t]*){2,}$/.test(line))
        ? lines.map(() => '')
        : lines.map(() => '---');
    case 'codeBlock':
      return toggleCodeBlock(lines);
    default:
      return lines;
  }
}

/** Sets (or removes) a specific heading level on the given lines. */
function setHeadingLevel(lines: string[], level: 1 | 2 | 3 | 4 | 5 | 6): string[] {
  const prefix = `${'#'.repeat(level)} `;
  const stripHeading = /^#{1,6}\s+/;
  const hasSameLevel = lines.every((line) => new RegExp(`^#{${level}}\\s+`).test(line));
  if (hasSameLevel) {
    return lines.map((line) => line.replace(stripHeading, ''));
  }
  return lines.map((line) => `${prefix}${line.replace(stripHeading, '')}`);
}

/** Toggles a line prefix (e.g. `> `, `- `, `1. `) on every line. */
function togglePrefix(
  lines: string[],
  stripPattern: RegExp,
  prefixFactory: (index: number) => string
): string[] {
  const hasPrefix = lines.every((line) => stripPattern.test(line));

  if (hasPrefix) {
    return lines.map((line) => line.replace(stripPattern, ''));
  }

  return lines.map((line, index) => `${prefixFactory(index)}${line}`);
}

/** Wraps or unwraps lines in a fenced code block (` ``` `). */
function toggleCodeBlock(lines: string[]): string[] {
  const hasCodeBlockMarker = (line: string) => /^```/.test(line);
  const isWrappedInCodeBlock =
    lines.length >= 2 &&
    hasCodeBlockMarker(lines[0]) &&
    hasCodeBlockMarker(lines[lines.length - 1]);

  if (isWrappedInCodeBlock) {
    return lines.slice(1, -1);
  }

  return ['```', ...lines, '```'];
}

/**
 * Expands the selection to cover complete lines and returns the
 * start/end offsets together with the extracted content.
 */
function getSelectedLineRange(text: string, selection: MarkdownSelection): {
  start: number;
  end: number;
  content: string;
} {
  const safeStart = Math.max(0, Math.min(selection.start, text.length));
  const safeEnd = Math.max(0, Math.min(selection.end, text.length));
  const start = text.lastIndexOf('\n', Math.max(safeStart - 1, 0));
  const end = text.indexOf('\n', safeEnd);

  const rangeStart = start === -1 ? 0 : start + 1;
  const rangeEnd = end === -1 ? text.length : end;

  return {
    start: rangeStart,
    end: rangeEnd,
    content: text.slice(rangeStart, rangeEnd),
  };
}

/** Type guard: returns `true` for inline formatting actions. */
function isInlineToolbarAction(action: MarkdownToolbarAction): action is MarkdownInlineToolbarAction {
  return action === 'bold' || action === 'italic' || action === 'strikethrough' || action === 'code';
}

/** Inserts an empty image markdown template at the current cursor position. */
function applyImageAction({
  text,
  selection,
  activeInlineActions,
}: {
  text: string;
  selection: MarkdownSelection;
  activeInlineActions: MarkdownInlineToolbarAction[];
}): MarkdownToolbarActionResult {
  const template = '![](url)';
  const cursor = selection.start;
  const nextText = `${text.slice(0, cursor)}${template}${text.slice(cursor)}`;
  // Place cursor inside the alt text brackets: ![|](url)
  const nextCursor = cursor + 2;
  return {
    text: nextText,
    selection: { start: nextCursor, end: nextCursor },
    activeInlineActions,
  };
}
