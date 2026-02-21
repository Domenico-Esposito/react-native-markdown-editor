import { highlightMarkdown } from '../markdownHighlight';
import type { HighlightSegment } from '../markdownHighlight.types';
import type { MarkdownToolbarAction } from '../markdownCore.types';

const ALL_FEATURES: MarkdownToolbarAction[] = ['bold', 'italic', 'strikethrough', 'code', 'codeBlock', 'heading', 'quote', 'unorderedList', 'orderedList', 'divider', 'image'];

/** Concatenates all segment texts to reconstruct the original input. */
function joinText(segments: HighlightSegment[]): string {
	return segments.map((s) => s.text).join('');
}

/** Filters segments to only the given type. */
function segmentsOfType(segments: HighlightSegment[], type: string): HighlightSegment[] {
	return segments.filter((s) => s.type === type);
}

// ---------------------------------------------------------------------------
// Basic behaviour
// ---------------------------------------------------------------------------

describe('highlightMarkdown', () => {
	it('returns a single text segment for plain text', () => {
		const result = highlightMarkdown('hello world', ALL_FEATURES);
		expect(result).toEqual([{ text: 'hello world', type: 'text' }]);
	});

	it('preserves total text length (character parity)', () => {
		const inputs = [
			'**bold** and *italic*',
			'# heading\nparagraph',
			'`code` and ~~strike~~',
			'[link](url) and ![img](src)',
			'> quote\n- list\n1. ordered',
			'```js\ncode\n```',
			'---',
			'\\*escaped\\*',
		];
		for (const input of inputs) {
			const segments = highlightMarkdown(input, ALL_FEATURES);
			expect(joinText(segments)).toBe(input);
		}
	});

	it('handles empty string', () => {
		const result = highlightMarkdown('', ALL_FEATURES);
		expect(result).toEqual([]);
	});
});

// ---------------------------------------------------------------------------
// Inline formatting
// ---------------------------------------------------------------------------

describe('highlightMarkdown – inline formatting', () => {
	it('highlights bold markers as delimiters', () => {
		const result = highlightMarkdown('**bold**', ALL_FEATURES);
		const delimiters = segmentsOfType(result, 'delimiter');
		expect(delimiters.map((s) => s.text)).toEqual(['**', '**']);
	});

	it('highlights bold text as bold', () => {
		const result = highlightMarkdown('**bold**', ALL_FEATURES);
		const bolds = segmentsOfType(result, 'bold');
		expect(bolds).toHaveLength(1);
		expect(bolds[0].text).toBe('bold');
	});

	it('highlights italic markers as delimiters', () => {
		const result = highlightMarkdown('*italic*', ALL_FEATURES);
		const delimiters = segmentsOfType(result, 'delimiter');
		expect(delimiters.map((s) => s.text)).toEqual(['*', '*']);
	});

	it('highlights italic text as italic', () => {
		const result = highlightMarkdown('*italic*', ALL_FEATURES);
		const italics = segmentsOfType(result, 'italic');
		expect(italics).toHaveLength(1);
		expect(italics[0].text).toBe('italic');
	});

	it('highlights strikethrough markers as delimiters', () => {
		const result = highlightMarkdown('~~strike~~', ALL_FEATURES);
		const delimiters = segmentsOfType(result, 'delimiter');
		expect(delimiters.map((s) => s.text)).toEqual(['~~', '~~']);
	});

	it('highlights strikethrough text', () => {
		const result = highlightMarkdown('~~strike~~', ALL_FEATURES);
		expect(segmentsOfType(result, 'strikethrough')).toHaveLength(1);
	});

	it('highlights inline code delimiters and content', () => {
		const result = highlightMarkdown('`code`', ALL_FEATURES);
		const codeSegs = segmentsOfType(result, 'code');
		expect(codeSegs).toHaveLength(1);
		expect(codeSegs[0].text).toBe('code');
		const delimiters = segmentsOfType(result, 'delimiter');
		expect(delimiters.map((s) => s.text)).toEqual(['`', '`']);
	});

	it('highlights escape backslash as delimiter', () => {
		const result = highlightMarkdown('\\*text', ALL_FEATURES);
		const delimiters = segmentsOfType(result, 'delimiter');
		expect(delimiters).toHaveLength(1);
		expect(delimiters[0].text).toBe('\\');
	});
});

// ---------------------------------------------------------------------------
// Links & Images
// ---------------------------------------------------------------------------

describe('highlightMarkdown – links & images', () => {
	it('highlights link with label, url and delimiters', () => {
		const result = highlightMarkdown('[label](url)', ALL_FEATURES);
		expect(segmentsOfType(result, 'link')).toHaveLength(1);
		expect(segmentsOfType(result, 'linkUrl')).toHaveLength(1);
		const delimiters = segmentsOfType(result, 'delimiter');
		expect(delimiters.map((s) => s.text)).toEqual(['[', '](', ')']);
	});

	it('highlights image with meta', () => {
		const result = highlightMarkdown('![alt text](img.png)', ALL_FEATURES);
		const imageSegs = segmentsOfType(result, 'image');
		expect(imageSegs).toHaveLength(1);
		expect(imageSegs[0].meta).toBeDefined();
		expect(imageSegs[0].meta!.src).toBe('img.png');
		expect(imageSegs[0].meta!.alt).toBe('alt text');
	});

	it('highlights image with title meta', () => {
		const result = highlightMarkdown('![alt](img.png "title")', ALL_FEATURES);
		const imageSegs = segmentsOfType(result, 'image');
		expect(imageSegs[0].meta!.title).toBe('title');
	});
});

// ---------------------------------------------------------------------------
// Block-level constructs
// ---------------------------------------------------------------------------

describe('highlightMarkdown – block constructs', () => {
	it('highlights heading delimiter and text', () => {
		const result = highlightMarkdown('# Hello', ALL_FEATURES);
		expect(result[0]).toMatchObject({ text: '# ', type: 'delimiter' });
		expect(result[1]).toMatchObject({ text: 'Hello', type: 'heading' });
	});

	it('heading segment carries headingLevel in meta', () => {
		const result = highlightMarkdown('## Title', ALL_FEATURES);
		expect(result[0].meta?.headingLevel).toBe('2');
		expect(result[1].meta?.headingLevel).toBe('2');
	});

	it('heading newline inherits heading context', () => {
		const result = highlightMarkdown('# H1\ntext', ALL_FEATURES);
		// The newline between heading and text should have heading meta
		const newlineSeg = result.find((s) => s.text === '\n' && s.type === 'heading');
		expect(newlineSeg).toBeDefined();
	});

	it('highlights horizontal rule', () => {
		const result = highlightMarkdown('---', ALL_FEATURES);
		expect(result).toEqual([{ text: '---', type: 'horizontalRule' }]);
	});

	it('highlights blockquote marker and content', () => {
		const result = highlightMarkdown('> quote', ALL_FEATURES);
		expect(result[0]).toMatchObject({ text: '> ', type: 'quoteMarker' });
		expect(result[1]).toMatchObject({ text: 'quote', type: 'quote' });
	});

	it('highlights unordered list marker', () => {
		const result = highlightMarkdown('- item', ALL_FEATURES);
		expect(result[0]).toMatchObject({ type: 'listMarker' });
	});

	it('highlights ordered list marker', () => {
		const result = highlightMarkdown('1. item', ALL_FEATURES);
		expect(result[0]).toMatchObject({ type: 'listMarker' });
	});

	it('highlights code fence as delimiter and content as codeBlock', () => {
		const result = highlightMarkdown('```js\ncode\n```', ALL_FEATURES);
		expect(result[0]).toMatchObject({ text: '```js', type: 'delimiter' });
		expect(result[2]).toMatchObject({ text: 'code', type: 'codeBlock' });
		expect(result[4]).toMatchObject({ text: '```', type: 'delimiter' });
	});
});

// ---------------------------------------------------------------------------
// Multi-line handling
// ---------------------------------------------------------------------------

describe('highlightMarkdown – multi-line', () => {
	it('inserts newline segments between lines', () => {
		const result = highlightMarkdown('line1\nline2', ALL_FEATURES);
		expect(result).toHaveLength(3);
		expect(result[1]).toMatchObject({ text: '\n', type: 'text' });
	});

	it('handles multiple empty lines', () => {
		const result = highlightMarkdown('\n\n', ALL_FEATURES);
		// 3 lines (empty, empty, empty) => text + newline + text + newline + text
		expect(joinText(result)).toBe('\n\n');
	});
});

// ---------------------------------------------------------------------------
// Feature flags
// ---------------------------------------------------------------------------

describe('highlightMarkdown – feature flags', () => {
	it('treats bold as plain text when bold is disabled', () => {
		// With italic enabled, individual * chars are parsed as italic delimiters
		const result = highlightMarkdown('**bold**', ['italic']);
		expect(segmentsOfType(result, 'bold')).toHaveLength(0);
	});

	it('treats italic as plain text when italic is disabled', () => {
		const result = highlightMarkdown('*italic*', ['bold']);
		expect(segmentsOfType(result, 'italic')).toHaveLength(0);
	});

	it('treats code as plain text when code is disabled', () => {
		const result = highlightMarkdown('`code`', ['bold']);
		expect(segmentsOfType(result, 'code')).toHaveLength(0);
	});

	it('treats heading as paragraph when heading is disabled', () => {
		const result = highlightMarkdown('# Heading', ['bold']);
		expect(segmentsOfType(result, 'heading')).toHaveLength(0);
		expect(segmentsOfType(result, 'delimiter').filter((s) => s.text === '# ')).toHaveLength(0);
	});

	it('treats horizontal rule as text when divider is disabled', () => {
		const result = highlightMarkdown('---', ['bold']);
		expect(segmentsOfType(result, 'horizontalRule')).toHaveLength(0);
	});

	it('treats quote as text when quote is disabled', () => {
		const result = highlightMarkdown('> quote', ['bold']);
		expect(segmentsOfType(result, 'quoteMarker')).toHaveLength(0);
		expect(segmentsOfType(result, 'quote')).toHaveLength(0);
	});

	it('treats unordered list as text when unorderedList is disabled', () => {
		const result = highlightMarkdown('- item', ['bold']);
		expect(segmentsOfType(result, 'listMarker')).toHaveLength(0);
	});

	it('treats ordered list as text when orderedList is disabled', () => {
		const result = highlightMarkdown('1. item', ['bold']);
		expect(segmentsOfType(result, 'listMarker')).toHaveLength(0);
	});

	it('treats code fence as text when codeBlock is disabled', () => {
		const result = highlightMarkdown('```\ncode\n```', ['bold']);
		expect(segmentsOfType(result, 'codeBlock')).toHaveLength(0);
	});

	it('treats image as text when image is disabled', () => {
		const result = highlightMarkdown('![alt](url)', ['bold']);
		expect(segmentsOfType(result, 'image')).toHaveLength(0);
	});

	it('undefined features enables all', () => {
		const result = highlightMarkdown('**bold**');
		expect(segmentsOfType(result, 'bold')).toHaveLength(1);
	});
});
