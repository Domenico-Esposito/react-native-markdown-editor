/**
 * Syntax highlighting module for the live preview editor.
 * Converts raw markdown text into an array of semantic segments,
 * preserving markdown delimiters as visible elements.
 *
 * Unlike the parser in markdownParser.ts (which produces an AST for rendering),
 * this module produces flat {text, type, meta?} segments optimized to be
 * rendered as children of a TextInput.
 *
 * Complexity: O(n) where n is text length.
 */

import { findUnescapedToken, parseImageSourceAndTitle, isEscaped, isMarkdownFeatureEnabled, isHeadingLevelEnabled } from './markdownSyntaxUtils';
import type { HighlightSegmentType, HighlightSegment, InlineSegmentType, InlineContext, RawInlineSegment } from './markdownHighlight.types';
import type { MarkdownToolbarAction } from './markdownCore.types';

export type { HighlightSegmentType, HighlightSegment } from './markdownHighlight.types';

// ---------------------------------------------------------------------------
// Regex patterns for block recognition
// ---------------------------------------------------------------------------

const HEADING_RE = /^(#{1,6})\s+(.*)/;
const BLOCKQUOTE_RE = /^(>\s?)(.*)/;
const HORIZONTAL_RULE_RE = /^ {0,3}([-*_])[ \t]*(?:\1[ \t]*){2,}$/;
const UNORDERED_LIST_RE = /^(\s*[-*+]\s+)(.*)/;
const ORDERED_LIST_RE = /^(\s*\d+\.\s+)(.*)/;
const CODE_FENCE_RE = /^```/;

type AppendInlineOptions = {
	baseTextType?: Extract<HighlightSegmentType, 'text' | 'heading' | 'quote'>;
	meta?: Record<string, string>;
	features?: MarkdownToolbarAction[];
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Converts markdown text into an array of semantic segments.
 *
 * Parsing happens line by line:
 * 1. Identifies block type (heading, list, quote, code block)
 * 2. Tags block markers (e.g. #, >, -) with dedicated segment types
 * 3. Analyzes inline content (bold, italic, code, link)
 * 4. Produces semantic segments rendered via segment components
 *
 * @param markdown - Raw markdown text
 * @param features - Optional list of enabled features. When provided,
 *                  only the corresponding syntax is highlighted; disabled
 *                  syntax is treated as plain text.
 * @returns Array of semantic segments
 */
export function highlightMarkdown(markdown: string, features?: MarkdownToolbarAction[]): HighlightSegment[] {
	const lines = markdown.split('\n');
	const segments: HighlightSegment[] = [];

	let inCodeBlock = false;
	let prevLineMeta: Record<string, string> | undefined;

	for (let i = 0; i < lines.length; i++) {
		if (i > 0) {
			// Newline inherits previous heading context so Android renders
			// the line break with the heading's larger lineHeight.
			if (prevLineMeta?.lineContext === 'heading') {
				segments.push({ text: '\n', type: 'heading', meta: prevLineMeta });
			} else {
				segments.push({ text: '\n', type: 'text' });
			}
		}
		prevLineMeta = undefined;

		const line = lines[i] ?? '';

		// Code fence: open/close code blocks
		if (isMarkdownFeatureEnabled(features, 'codeBlock') && CODE_FENCE_RE.test(line)) {
			segments.push({
				text: line,
				type: 'delimiter',
				meta: { lineContext: 'codeFence' },
			});
			inCodeBlock = !inCodeBlock;
			continue;
		}

		// Inside a code block
		if (inCodeBlock) {
			segments.push({
				text: line,
				type: 'codeBlock',
			});
			continue;
		}

		// Heading: # Title
		const headingMatch = line.match(HEADING_RE);
		if (headingMatch && !isEscaped(line, 0) && isHeadingLevelEnabled(features, headingMatch[1]!.length)) {
			const level = headingMatch[1]!.length;
			const headingMeta = { lineContext: 'heading', headingLevel: String(level) };
			prevLineMeta = headingMeta;
			segments.push({
				text: `${headingMatch[1]} `,
				type: 'delimiter',
				meta: headingMeta,
			});
			appendInlineSegments(segments, headingMatch[2] ?? '', {
				baseTextType: 'heading',
				meta: headingMeta,
				features,
			});
			continue;
		}

		// Horizontal rule: ---, ***, ___
		if (isMarkdownFeatureEnabled(features, 'divider') && HORIZONTAL_RULE_RE.test(line)) {
			segments.push({
				text: line,
				type: 'horizontalRule',
			});
			continue;
		}

		// Blockquote: > quote
		if (isMarkdownFeatureEnabled(features, 'quote')) {
			const quoteMatch = line.match(BLOCKQUOTE_RE);
			if (quoteMatch) {
				const quoteMeta = { lineContext: 'quote' };
				segments.push({
					text: quoteMatch[1] ?? '',
					type: 'quoteMarker',
					meta: quoteMeta,
				});
				appendInlineSegments(segments, quoteMatch[2] ?? '', {
					baseTextType: 'quote',
					meta: quoteMeta,
					features,
				});
				continue;
			}
		}

		// Unordered list: - item
		if (isMarkdownFeatureEnabled(features, 'unorderedList')) {
			const ulMatch = line.match(UNORDERED_LIST_RE);
			if (ulMatch) {
				segments.push({
					text: ulMatch[1] ?? '',
					type: 'listMarker',
				});
				appendInlineSegments(segments, ulMatch[2] ?? '', { features });
				continue;
			}
		}

		// Ordered list: 1. item
		if (isMarkdownFeatureEnabled(features, 'orderedList')) {
			const olMatch = line.match(ORDERED_LIST_RE);
			if (olMatch) {
				segments.push({
					text: olMatch[1] ?? '',
					type: 'listMarker',
				});
				appendInlineSegments(segments, olMatch[2] ?? '', { features });
				continue;
			}
		}

		// Simple text line: inline parsing only
		appendInlineSegments(segments, line, { features });
	}

	return segments;
}

// ---------------------------------------------------------------------------
// Segment composition functions
// ---------------------------------------------------------------------------

/**
 * Analyzes inline text and adds semantic segments to the array.
 */
function appendInlineSegments(segments: HighlightSegment[], text: string, options: AppendInlineOptions = {}): void {
	const inlineSegs = parseInlineHighlight(text, undefined, options.features);
	for (const seg of inlineSegs) {
		const type = resolveInlineSegmentType(seg, options.baseTextType ?? 'text');
		const mergedMeta = options.meta || seg.meta ? { ...(options.meta ?? {}), ...(seg.meta ?? {}) } : undefined;
		segments.push({
			text: seg.text,
			type,
			...(mergedMeta ? { meta: mergedMeta } : {}),
		});
	}
}

/**
 * Maps a raw inline segment to its public semantic HighlightSegmentType.
 */
function resolveInlineSegmentType(seg: RawInlineSegment, baseTextType: Extract<HighlightSegmentType, 'text' | 'heading' | 'quote'>): HighlightSegmentType {
	switch (seg.type) {
		case 'delimiter':
			return 'delimiter';
		case 'code':
			return 'code';
		case 'link-label':
			return 'link';
		case 'link-url':
			return 'linkUrl';
		case 'image-alt':
			return 'image';
		case 'text':
		default:
			if (seg.bold) return 'bold';
			if (seg.italic) return 'italic';
			if (seg.strikethrough) return 'strikethrough';
			return baseTextType;
	}
}

// ---------------------------------------------------------------------------
// Inline parser
// ---------------------------------------------------------------------------

/**
 * Inline parser that preserves markdown delimiters and tracks
 * formatting context (bold, italic) recursively.
 *
 * Unlike parseMarkdownInline in markdownParser.ts:
 * - Delimiters (**, _, `, etc.) are kept as 'delimiter' segments
 * - Bold/italic context is propagated to nested levels
 * - Produces flat segments (not a tree) for direct rendering
 *
 * @param content - Inline text to analyze
 * @param context - Formatting context inherited from upper level
 */
function parseInlineHighlight(content: string, context: InlineContext = { bold: false, italic: false, strikethrough: false }, features?: MarkdownToolbarAction[]): RawInlineSegment[] {
	const segments: RawInlineSegment[] = [];
	let cursor = 0;

	/**
	 * Adds text to segments array, merging adjacent segments
	 * of same type to reduce number of Text nodes in rendering.
	 */
	const appendText = (value: string, type: InlineSegmentType = 'text') => {
		if (!value) return;
		const last = segments[segments.length - 1];
		// Merge only if type and formatting context match
		if (last && last.type === type && last.bold === context.bold && last.italic === context.italic && last.strikethrough === context.strikethrough) {
			last.text += value;
			return;
		}
		segments.push({
			text: value,
			type,
			bold: context.bold,
			italic: context.italic,
			strikethrough: context.strikethrough,
		});
	};

	while (cursor < content.length) {
		// Escape: \* → * literal
		if (content[cursor] === '\\' && cursor + 1 < content.length) {
			// Keep the backslash visible as a delimiter to preserve character count
			// parity with the input value (required for correct cursor positioning).
			segments.push({ text: '\\', type: 'delimiter', bold: false, italic: false, strikethrough: false });
			appendText(content[cursor + 1] ?? '');
			cursor += 2;
			continue;
		}

		// Inline code: `code`
		if (isMarkdownFeatureEnabled(features, 'code') && content[cursor] === '`') {
			const closeIdx = findUnescapedToken(content, '`', cursor + 1);
			if (closeIdx !== -1) {
				// Backticks are delimiters, content is code
				segments.push({ text: '`', type: 'delimiter', bold: false, italic: false, strikethrough: false });
				segments.push({
					text: content.slice(cursor + 1, closeIdx),
					type: 'code',
					bold: false,
					italic: false,
					strikethrough: false,
				});
				segments.push({ text: '`', type: 'delimiter', bold: false, italic: false, strikethrough: false });
				cursor = closeIdx + 1;
				continue;
			}
		}

		// Bold: **text** or __text__
		if (isMarkdownFeatureEnabled(features, 'bold') && (content.startsWith('**', cursor) || content.startsWith('__', cursor))) {
			const marker = content.slice(cursor, cursor + 2);
			const closeIdx = findUnescapedToken(content, marker, cursor + 2);
			if (closeIdx !== -1) {
				segments.push({ text: marker, type: 'delimiter', bold: false, italic: false, strikethrough: false });
				// Recursion with bold context active: inner content
				// inherits italic state from upper level
				const inner = parseInlineHighlight(content.slice(cursor + 2, closeIdx), { ...context, bold: true }, features);
				segments.push(...inner);
				segments.push({ text: marker, type: 'delimiter', bold: false, italic: false, strikethrough: false });
				cursor = closeIdx + 2;
				continue;
			}
		}

		// Strikethrough: ~~text~~
		if (isMarkdownFeatureEnabled(features, 'strikethrough') && content.startsWith('~~', cursor)) {
			const closeIdx = findUnescapedToken(content, '~~', cursor + 2);
			if (closeIdx !== -1) {
				segments.push({ text: '~~', type: 'delimiter', bold: false, italic: false, strikethrough: false });
				const inner = parseInlineHighlight(content.slice(cursor + 2, closeIdx), { ...context, strikethrough: true }, features);
				segments.push(...inner);
				segments.push({ text: '~~', type: 'delimiter', bold: false, italic: false, strikethrough: false });
				cursor = closeIdx + 2;
				continue;
			}
		}

		// Italic: *text* or _text_
		if (isMarkdownFeatureEnabled(features, 'italic') && (content[cursor] === '*' || content[cursor] === '_')) {
			const marker = content[cursor]!;
			const closeIdx = findUnescapedToken(content, marker, cursor + 1);
			if (closeIdx !== -1) {
				segments.push({ text: marker, type: 'delimiter', bold: false, italic: false, strikethrough: false });
				// Recursion with italic context active: inner content
				// inherits bold state from upper level
				const inner = parseInlineHighlight(content.slice(cursor + 1, closeIdx), { ...context, italic: true }, features);
				segments.push(...inner);
				segments.push({ text: marker, type: 'delimiter', bold: false, italic: false, strikethrough: false });
				cursor = closeIdx + 1;
				continue;
			}
		}

		// Image: ![alt](url) or ![alt](url "title")
		if (content[cursor] === '!' && content[cursor + 1] === '[') {
			if (isMarkdownFeatureEnabled(features, 'image')) {
				const altClose = findUnescapedToken(content, ']', cursor + 2);
				if (altClose !== -1 && content[altClose + 1] === '(') {
					const srcClose = findUnescapedToken(content, ')', altClose + 2);
					if (srcClose !== -1) {
						const fullText = content.slice(cursor, srcClose + 1);
						const alt = content.slice(cursor + 2, altClose);
						const rawUrl = content.slice(altClose + 2, srcClose).trim();
						const { src, title } = parseImageSourceAndTitle(rawUrl, { unescapeSrc: false });
						segments.push({
							text: fullText,
							type: 'image-alt',
							bold: context.bold,
							italic: context.italic,
							strikethrough: context.strikethrough,
							meta: { src, alt, ...(title ? { title } : {}) },
						});
						cursor = srcClose + 1;
						continue;
					}
				}
			} else {
				// Image disabled: consume "!" as plain text and skip ahead so
				// the link parser does not pick up "[alt](url)" as a link.
				const altClose = findUnescapedToken(content, ']', cursor + 2);
				if (altClose !== -1 && content[altClose + 1] === '(') {
					const srcClose = findUnescapedToken(content, ')', altClose + 2);
					if (srcClose !== -1) {
						appendText(content.slice(cursor, srcClose + 1));
						cursor = srcClose + 1;
						continue;
					}
				}
				appendText('!');
				cursor += 1;
				continue;
			}
		}

		// Link: [label](url)
		if (content[cursor] === '[') {
			const labelClose = findUnescapedToken(content, ']', cursor + 1);
			if (labelClose !== -1 && content[labelClose + 1] === '(') {
				const hrefClose = findUnescapedToken(content, ')', labelClose + 2);
				if (hrefClose !== -1) {
					// Delimiters [] and () are tagged separately from label/url
					segments.push({ text: '[', type: 'delimiter', bold: context.bold, italic: context.italic, strikethrough: context.strikethrough });
					segments.push({
						text: content.slice(cursor + 1, labelClose),
						type: 'link-label',
						bold: context.bold,
						italic: context.italic,
						strikethrough: context.strikethrough,
					});
					segments.push({ text: '](', type: 'delimiter', bold: context.bold, italic: context.italic, strikethrough: context.strikethrough });
					segments.push({
						text: content.slice(labelClose + 2, hrefClose),
						type: 'link-url',
						bold: context.bold,
						italic: context.italic,
						strikethrough: context.strikethrough,
					});
					segments.push({ text: ')', type: 'delimiter', bold: context.bold, italic: context.italic, strikethrough: context.strikethrough });
					cursor = hrefClose + 1;
					continue;
				}
			}
		}

		// Simple text character
		appendText(content[cursor] ?? '');
		cursor += 1;
	}

	return segments;
}
