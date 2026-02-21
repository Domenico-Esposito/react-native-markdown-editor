/**
 * Low-level helpers shared by the markdown parser and the syntax highlighter.
 *
 * These utilities deal with escape sequences, token scanning, and
 * image-source extraction — concerns common to both modules.
 */

import type { MarkdownToolbarAction } from './markdownCore.types';

/** Matches a backslash followed by a markdown-special character. */
const ESCAPED_MARKDOWN_PATTERN = /\\([\\`*_~[\]()#+.!>{}-])/g;

/**
 * Scans `input` for the first occurrence of `token` starting at `startIndex`,
 * skipping any occurrence preceded by an odd number of backslashes.
 *
 * @returns The index of the token, or `-1` if not found.
 */
export function findUnescapedToken(input: string, token: string, startIndex: number): number {
  if (token.length === 0) {
    return -1;
  }

  for (let index = startIndex; index <= input.length - token.length; index += 1) {
    if (input.slice(index, index + token.length) !== token) {
      continue;
    }
    if (!isEscaped(input, index)) {
      return index;
    }
  }

  return -1;
}

/**
 * Returns `true` when the character at `index` is preceded by an
 * odd number of backslashes (i.e. it is escaped).
 */
export function isEscaped(value: string, index: number): boolean {
  let backslashes = 0;
  for (let cursor = index - 1; cursor >= 0 && value[cursor] === '\\'; cursor -= 1) {
    backslashes += 1;
  }
  return backslashes % 2 === 1;
}

/**
 * Strips markdown escape backslashes from `value`.
 * E.g. `"\\*hello\\*"` → `"*hello*"`.
 */
export function unescapeMarkdown(value: string): string {
  return value.replace(ESCAPED_MARKDOWN_PATTERN, '$1');
}

/**
 * Parses the raw content inside `(…)` of an image markdown.
 *
 * Supports:
 * - `url` → `{ src: "url" }`
 * - `url "title"` or `url 'title'` → `{ src: "url", title: "title" }`
 *
 * @param raw - The string between the parentheses.
 * @param options.unescapeSrc - Whether to unescape the source URL (default `true`).
 */
export function parseImageSourceAndTitle(
  raw: string,
  options: { unescapeSrc?: boolean } = {}
): { src: string; title?: string } {
  const { unescapeSrc = true } = options;
  const normalizeSrc = (value: string) => (unescapeSrc ? unescapeMarkdown(value) : value);
  const trimmed = raw.trim();
  const titleMatch = trimmed.match(/^(.+?)\s+(?:"([^"]*)"|'([^']*)')$/);

  if (titleMatch) {
    return {
      src: normalizeSrc(titleMatch[1].trim()),
      title: titleMatch[2] ?? titleMatch[3],
    };
  }

  return { src: normalizeSrc(trimmed) };
}

/**
 * Checks whether a markdown feature is enabled based on the provided features list.
 * If `features` is `undefined`, all features are considered enabled (backward compatible).
 *
 * Heading features (`heading`, `heading1`–`heading6`) are grouped: if any heading
 * feature is present the `'heading'` feature is considered enabled.
 */
export type MarkdownFeature =
  | 'bold'
  | 'italic'
  | 'strikethrough'
  | 'code'
  | 'codeBlock'
  | 'heading'
  | 'quote'
  | 'unorderedList'
  | 'orderedList'
  | 'divider'
  | 'image';

export function isMarkdownFeatureEnabled(
  features: MarkdownToolbarAction[] | undefined,
  feature: MarkdownFeature,
): boolean {
  if (!features) return true;
  if (feature === 'heading') {
    return features.some(
      (a) =>
        a === 'heading' ||
        a === 'heading1' ||
        a === 'heading2' ||
        a === 'heading3' ||
        a === 'heading4' ||
        a === 'heading5' ||
        a === 'heading6',
    );
  }
  return features.includes(feature as MarkdownToolbarAction);
}

/**
 * Checks whether a specific heading level is enabled.
 *
 * - If `features` is `undefined` → all levels enabled.
 * - If `features` contains `'heading'` (generic) → all levels enabled.
 * - Otherwise only the explicitly listed levels (`'heading1'`…`'heading6'`) are enabled.
 */
export function isHeadingLevelEnabled(
  features: MarkdownToolbarAction[] | undefined,
  level: number,
): boolean {
  if (!features) return true;
  if (features.includes('heading')) return true;
  return features.includes(`heading${level}` as MarkdownToolbarAction);
}
