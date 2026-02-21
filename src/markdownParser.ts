import type { MarkdownBlockNode, MarkdownInlineNode, MarkdownToolbarAction } from './markdownCore.types';
import { findUnescapedToken, parseImageSourceAndTitle, unescapeMarkdown, isEscaped, isMarkdownFeatureEnabled, isHeadingLevelEnabled } from './markdownSyntaxUtils';

// ---------------------------------------------------------------------------
// Regex patterns for block recognition
// ---------------------------------------------------------------------------

const FENCE_PATTERN = /^```([\w-]+)?\s*$/;
const FENCE_CLOSE_PATTERN = /^```\s*$/;
const HEADING_PATTERN = /^(#{1,6})\s+(.+)$/;
const BLOCKQUOTE_PATTERN = /^>\s?(.*)$/;
const HORIZONTAL_RULE_PATTERN = /^ {0,3}([-*_])[ \t]*(?:\1[ \t]*){2,}$/;
const UNORDERED_LIST_PATTERN = /^\s*[-*+]\s+(.*)$/;
const ORDERED_LIST_PATTERN = /^\s*\d+\.\s+(.*)$/;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parses markdown text into block nodes.
 *
 * Parsing is line-oriented: block-level constructs are identified first,
 * then text fragments are delegated to the inline parser.
 */
export function parseMarkdown(markdown: string, features?: MarkdownToolbarAction[]): MarkdownBlockNode[] {
	const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
	const blocks: MarkdownBlockNode[] = [];
	let cursor = 0;

	while (cursor < lines.length) {
		const line = lines[cursor] ?? '';

		if (line.trim().length === 0) {
			blocks.push({ type: 'spacer' });
			cursor += 1;
			continue;
		}

		//  Fenced code block: ```lang ... ```
		if (isMarkdownFeatureEnabled(features, 'codeBlock')) {
			const fenceMatch = line.match(FENCE_PATTERN);
			if (fenceMatch) {
				const closingFenceIndex = findClosingFence(lines, cursor + 1);
				if (closingFenceIndex !== -1) {
					blocks.push({
						type: 'codeBlock',
						language: fenceMatch[1],
						content: lines.slice(cursor + 1, closingFenceIndex).join('\n'),
					});
					cursor = closingFenceIndex + 1;
					continue;
				}
			}
		}

		//  Heading: # ... ######
		const headingMatch = line.match(HEADING_PATTERN);
		if (headingMatch && !isEscaped(line, 0) && isHeadingLevelEnabled(features, headingMatch[1].length)) {
			const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
			blocks.push({
				type: 'heading',
				level,
				children: parseMarkdownInline(headingMatch[2], features),
			});
			cursor += 1;
			continue;
		}

		//  Horizontal rule: ---, ***, ___
		if (isMarkdownFeatureEnabled(features, 'divider') && HORIZONTAL_RULE_PATTERN.test(line)) {
			blocks.push({ type: 'horizontalRule' });
			cursor += 1;
			continue;
		}

		//  Blockquote: > quote
		if (isMarkdownFeatureEnabled(features, 'quote') && BLOCKQUOTE_PATTERN.test(line)) {
			const quotedLines: string[] = [];
			while (cursor < lines.length) {
				const quoteMatch = lines[cursor]?.match(BLOCKQUOTE_PATTERN);
				if (!quoteMatch) {
					break;
				}
				quotedLines.push(quoteMatch[1]);
				cursor += 1;
			}
			blocks.push({
				type: 'blockquote',
				children: parseMarkdownInline(quotedLines.join('\n'), features),
			});
			continue;
		}

		//  List: bullet (-, *, +) or ordered (1.)
		if (
			(isMarkdownFeatureEnabled(features, 'unorderedList') && UNORDERED_LIST_PATTERN.test(line)) ||
			(isMarkdownFeatureEnabled(features, 'orderedList') && ORDERED_LIST_PATTERN.test(line))
		) {
			const ordered = ORDERED_LIST_PATTERN.test(line);
			const itemPattern = ordered ? ORDERED_LIST_PATTERN : UNORDERED_LIST_PATTERN;
			const items: MarkdownInlineNode[][] = [];

			while (cursor < lines.length) {
				const itemMatch = lines[cursor]?.match(itemPattern);
				if (!itemMatch) {
					break;
				}
				items.push(parseMarkdownInline(itemMatch[1], features));
				cursor += 1;
			}

			blocks.push({
				type: 'list',
				ordered,
				items,
			});
			continue;
		}

		//  Paragraph: consecutive non-empty lines until next block start
		const paragraphLines: string[] = [];
		while (cursor < lines.length) {
			const currentLine = lines[cursor] ?? '';
			if (currentLine.trim().length === 0 || isBlockStart(lines, cursor, features)) {
				break;
			}
			paragraphLines.push(currentLine);
			cursor += 1;
		}

		if (paragraphLines.length > 0) {
			blocks.push({
				type: 'paragraph',
				children: parseMarkdownInline(paragraphLines.join('\n'), features),
			});
			continue;
		}

		cursor += 1;
	}

	return blocks;
}

/**
 * Parses inline markdown tokens inside a block.
 *
 * The parser scans left-to-right and uses recursion for nested emphasis
 * and link labels.
 */
export function parseMarkdownInline(content: string, features?: MarkdownToolbarAction[]): MarkdownInlineNode[] {
	const nodes: MarkdownInlineNode[] = [];
	let cursor = 0;

	const appendText = (value: string) => {
		if (!value) {
			return;
		}
		const lastNode = nodes[nodes.length - 1];
		if (lastNode?.type === 'text') {
			lastNode.content += value;
			return;
		}
		// Keep adjacent plain text in a single node to reduce fragmentation.
		nodes.push({ type: 'text', content: value });
	};

	while (cursor < content.length) {
		// Escape: \* -> literal *
		if (content[cursor] === '\\' && cursor + 1 < content.length) {
			appendText(content[cursor + 1] ?? '');
			cursor += 2;
			continue;
		}

		// Inline code: `code`
		if (isMarkdownFeatureEnabled(features, 'code') && content[cursor] === '`') {
			const closingIndex = findUnescapedToken(content, '`', cursor + 1);
			if (closingIndex !== -1) {
				nodes.push({
					type: 'code',
					content: unescapeMarkdown(content.slice(cursor + 1, closingIndex)),
				});
				cursor = closingIndex + 1;
				continue;
			}
		}

		// Bold: **text** or __text__
		if (isMarkdownFeatureEnabled(features, 'bold') && (content.startsWith('**', cursor) || content.startsWith('__', cursor))) {
			const marker = content.slice(cursor, cursor + 2);
			const closingIndex = findUnescapedToken(content, marker, cursor + marker.length);
			if (closingIndex !== -1) {
				nodes.push({
					type: 'bold',
					children: parseMarkdownInline(content.slice(cursor + marker.length, closingIndex), features),
				});
				cursor = closingIndex + marker.length;
				continue;
			}
		}

		// Strikethrough: ~~text~~
		if (isMarkdownFeatureEnabled(features, 'strikethrough') && content.startsWith('~~', cursor)) {
			const closingIndex = findUnescapedToken(content, '~~', cursor + 2);
			if (closingIndex !== -1) {
				nodes.push({
					type: 'strikethrough',
					children: parseMarkdownInline(content.slice(cursor + 2, closingIndex), features),
				});
				cursor = closingIndex + 2;
				continue;
			}
		}

		// Italic: *text* or _text_
		if (isMarkdownFeatureEnabled(features, 'italic') && (content[cursor] === '*' || content[cursor] === '_')) {
			const marker = content[cursor];
			const closingIndex = findUnescapedToken(content, marker, cursor + 1);
			if (closingIndex !== -1) {
				nodes.push({
					type: 'italic',
					children: parseMarkdownInline(content.slice(cursor + 1, closingIndex), features),
				});
				cursor = closingIndex + 1;
				continue;
			}
		}

		// Image: ![alt](url) or ![alt](url "title")
		if (content[cursor] === '!' && content[cursor + 1] === '[') {
			if (isMarkdownFeatureEnabled(features, 'image')) {
				const altClosingIndex = findUnescapedToken(content, ']', cursor + 2);
				const srcOpenIndex = altClosingIndex + 1;

				if (altClosingIndex !== -1 && content[srcOpenIndex] === '(') {
					const srcClosingIndex = findUnescapedToken(content, ')', srcOpenIndex + 1);
					if (srcClosingIndex !== -1) {
						const alt = unescapeMarkdown(content.slice(cursor + 2, altClosingIndex));
						const raw = content.slice(srcOpenIndex + 1, srcClosingIndex);
						const { src, title } = parseImageSourceAndTitle(raw);
						nodes.push({ type: 'image', src, alt, title });
						cursor = srcClosingIndex + 1;
						continue;
					}
				}
			} else {
				// Image disabled: consume the whole "![alt](url)" as plain text
				// so the link parser does not pick up "[alt](url)" as a link.
				const altClosingIndex = findUnescapedToken(content, ']', cursor + 2);
				if (altClosingIndex !== -1 && content[altClosingIndex + 1] === '(') {
					const srcClosingIndex = findUnescapedToken(content, ')', altClosingIndex + 2);
					if (srcClosingIndex !== -1) {
						appendText(content.slice(cursor, srcClosingIndex + 1));
						cursor = srcClosingIndex + 1;
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
			const labelClosingIndex = findUnescapedToken(content, ']', cursor + 1);
			const linkOpenIndex = labelClosingIndex + 1;

			if (labelClosingIndex !== -1 && content[linkOpenIndex] === '(') {
				const hrefClosingIndex = findUnescapedToken(content, ')', linkOpenIndex + 1);
				if (hrefClosingIndex !== -1) {
					nodes.push({
						type: 'link',
						href: unescapeMarkdown(content.slice(linkOpenIndex + 1, hrefClosingIndex)),
						children: parseMarkdownInline(content.slice(cursor + 1, labelClosingIndex), features),
					});
					cursor = hrefClosingIndex + 1;
					continue;
				}
			}
		}

		// Simple text character.
		appendText(content[cursor] ?? '');
		cursor += 1;
	}

	return nodes;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Determines whether the line at `index` begins a new block-level construct
 * (heading, rule, quote, list, or fenced code block).
 *
 * Used by the paragraph collector to know when to stop consuming lines.
 */
function isBlockStart(lines: string[], index: number, features?: MarkdownToolbarAction[]): boolean {
	const line = lines[index] ?? '';
	if (line.trim().length === 0) {
		return false;
	}
	if (isMarkdownFeatureEnabled(features, 'heading') && HEADING_PATTERN.test(line)) {
		const m = line.match(HEADING_PATTERN);
		if (m && isHeadingLevelEnabled(features, m[1].length)) {
			return true;
		}
	}
	if (isMarkdownFeatureEnabled(features, 'divider') && HORIZONTAL_RULE_PATTERN.test(line)) {
		return true;
	}
	if (isMarkdownFeatureEnabled(features, 'quote') && BLOCKQUOTE_PATTERN.test(line)) {
		return true;
	}
	if (
		(isMarkdownFeatureEnabled(features, 'unorderedList') && UNORDERED_LIST_PATTERN.test(line)) ||
		(isMarkdownFeatureEnabled(features, 'orderedList') && ORDERED_LIST_PATTERN.test(line))
	) {
		return true;
	}
	if (isMarkdownFeatureEnabled(features, 'codeBlock') && FENCE_PATTERN.test(line)) {
		// Avoid treating an unmatched opening fence as a block boundary.
		return findClosingFence(lines, index + 1) !== -1;
	}
	return false;
}

/**
 * Scans forward from `startIndex` looking for a closing code fence (` ``` `).
 *
 * @returns The line index of the closing fence, or `-1` if none is found.
 */
function findClosingFence(lines: string[], startIndex: number): number {
	for (let index = startIndex; index < lines.length; index += 1) {
		if (FENCE_CLOSE_PATTERN.test(lines[index] ?? '')) {
			return index;
		}
	}
	return -1;
}
