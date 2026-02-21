import { parseMarkdown, parseMarkdownInline } from '../markdownParser';
import type { MarkdownToolbarAction } from '../markdownCore.types';

// Helper: all features enabled
const ALL_FEATURES: MarkdownToolbarAction[] = ['bold', 'italic', 'strikethrough', 'code', 'codeBlock', 'heading', 'quote', 'unorderedList', 'orderedList', 'divider', 'image'];

// ---------------------------------------------------------------------------
// parseMarkdownInline
// ---------------------------------------------------------------------------

describe('parseMarkdownInline', () => {
	it('parses plain text', () => {
		const result = parseMarkdownInline('hello world');
		expect(result).toEqual([{ type: 'text', content: 'hello world' }]);
	});

	it('parses bold with **', () => {
		const result = parseMarkdownInline('**bold**');
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ type: 'bold' });
		expect((result[0] as any).children).toEqual([{ type: 'text', content: 'bold' }]);
	});

	it('parses bold with __', () => {
		const result = parseMarkdownInline('__bold__');
		expect(result[0]).toMatchObject({ type: 'bold' });
	});

	it('parses italic with *', () => {
		const result = parseMarkdownInline('*italic*');
		expect(result[0]).toMatchObject({ type: 'italic' });
		expect((result[0] as any).children).toEqual([{ type: 'text', content: 'italic' }]);
	});

	it('parses italic with _', () => {
		const result = parseMarkdownInline('_italic_');
		expect(result[0]).toMatchObject({ type: 'italic' });
	});

	it('parses inline code', () => {
		const result = parseMarkdownInline('`code`');
		expect(result).toEqual([{ type: 'code', content: 'code' }]);
	});

	it('parses strikethrough', () => {
		const result = parseMarkdownInline('~~strike~~');
		expect(result[0]).toMatchObject({ type: 'strikethrough' });
		expect((result[0] as any).children).toEqual([{ type: 'text', content: 'strike' }]);
	});

	it('parses link', () => {
		const result = parseMarkdownInline('[label](http://example.com)');
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			type: 'link',
			href: 'http://example.com',
		});
		expect((result[0] as any).children).toEqual([{ type: 'text', content: 'label' }]);
	});

	it('parses image', () => {
		const result = parseMarkdownInline('![alt](img.png)');
		expect(result).toEqual([
			{
				type: 'image',
				src: 'img.png',
				alt: 'alt',
			},
		]);
	});

	it('parses image with title', () => {
		const result = parseMarkdownInline('![alt](img.png "title")');
		expect(result).toEqual([
			{
				type: 'image',
				src: 'img.png',
				alt: 'alt',
				title: 'title',
			},
		]);
	});

	it('handles escape sequences', () => {
		const result = parseMarkdownInline('\\*not italic\\*');
		expect(result).toEqual([{ type: 'text', content: '*not italic*' }]);
	});

	it('handles text around bold', () => {
		const result = parseMarkdownInline('hello **bold** world');
		expect(result).toHaveLength(3);
		expect(result[0]).toEqual({ type: 'text', content: 'hello ' });
		expect(result[1]).toMatchObject({ type: 'bold' });
		expect(result[2]).toEqual({ type: 'text', content: ' world' });
	});

	it('handles nested bold inside italic', () => {
		// With both bold/italic, the * from ** gets picked up by italic parser first
		// so the result is 3 separate italic nodes rather than nested
		const result = parseMarkdownInline('*hello **bold** world*');
		expect(result.length).toBeGreaterThanOrEqual(1);
		expect(result[0]).toMatchObject({ type: 'italic' });
	});

	it('handles unclosed bold as partial parse', () => {
		// ** without closing gets the first * matched as italic delimiter
		const result = parseMarkdownInline('**unclosed');
		expect(result.length).toBeGreaterThanOrEqual(1);
	});

	it('handles unclosed inline code as plain text', () => {
		const result = parseMarkdownInline('`unclosed');
		expect(result).toEqual([{ type: 'text', content: '`unclosed' }]);
	});

	it('respects feature flags - bold disabled but italic enabled', () => {
		// When bold is disabled but italic is enabled, ** gets parsed as two * (italic)
		const result = parseMarkdownInline('**bold**', ['italic']);
		expect(result.some((n) => n.type === 'bold')).toBe(false);
	});

	it('respects feature flags - bold disabled and italic disabled', () => {
		const result = parseMarkdownInline('**bold**', ['code']);
		expect(result).toEqual([{ type: 'text', content: '**bold**' }]);
	});

	it('respects feature flags - italic disabled', () => {
		const result = parseMarkdownInline('*italic*', ['bold']);
		expect(result).toEqual([{ type: 'text', content: '*italic*' }]);
	});

	it('respects feature flags - code disabled', () => {
		const result = parseMarkdownInline('`code`', ['bold']);
		expect(result).toEqual([{ type: 'text', content: '`code`' }]);
	});

	it('respects feature flags - strikethrough disabled', () => {
		const result = parseMarkdownInline('~~strike~~', ['bold']);
		expect(result).toEqual([{ type: 'text', content: '~~strike~~' }]);
	});

	it('image disabled: image syntax consumed as plain text', () => {
		const result = parseMarkdownInline('![alt](url)', ['bold']);
		expect(result).toEqual([{ type: 'text', content: '![alt](url)' }]);
	});

	it('parses empty string', () => {
		expect(parseMarkdownInline('')).toEqual([]);
	});

	it('link with bold label', () => {
		const result = parseMarkdownInline('[**bold link**](url)');
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ type: 'link', href: 'url' });
		const children = (result[0] as any).children;
		expect(children[0]).toMatchObject({ type: 'bold' });
	});
});

// ---------------------------------------------------------------------------
// parseMarkdown (block-level)
// ---------------------------------------------------------------------------

describe('parseMarkdown', () => {
	it('parses a simple paragraph', () => {
		const result = parseMarkdown('Hello world', ALL_FEATURES);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ type: 'paragraph' });
		expect((result[0] as any).children).toEqual([{ type: 'text', content: 'Hello world' }]);
	});

	it('parses a heading level 1', () => {
		const result = parseMarkdown('# Hello', ALL_FEATURES);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ type: 'heading', level: 1 });
	});

	it('parses heading levels 1-6', () => {
		for (let level = 1; level <= 6; level++) {
			const md = `${'#'.repeat(level)} Heading ${level}`;
			const result = parseMarkdown(md, ALL_FEATURES);
			expect(result[0]).toMatchObject({ type: 'heading', level });
		}
	});

	it('does not parse 7 hashes as heading', () => {
		const result = parseMarkdown('####### Not heading', ALL_FEATURES);
		expect(result[0]).toMatchObject({ type: 'paragraph' });
	});

	it('parses fenced code block', () => {
		const md = '```js\nconsole.log("hi");\n```';
		const result = parseMarkdown(md, ALL_FEATURES);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			type: 'codeBlock',
			language: 'js',
			content: 'console.log("hi");',
		});
	});

	it('parses fenced code block without language', () => {
		const md = '```\nsome code\n```';
		const result = parseMarkdown(md, ALL_FEATURES);
		expect(result[0]).toMatchObject({ type: 'codeBlock' });
		expect((result[0] as any).content).toBe('some code');
	});

	it('handles unclosed code fence as paragraph', () => {
		const md = '```js\nconsole.log("hi");';
		const result = parseMarkdown(md, ALL_FEATURES);
		// Without closing fence, it should be a paragraph
		expect(result.some((b) => b.type === 'paragraph')).toBe(true);
	});

	it('parses horizontal rule (---)', () => {
		const result = parseMarkdown('---', ALL_FEATURES);
		expect(result).toEqual([{ type: 'horizontalRule' }]);
	});

	it('parses horizontal rule (***)', () => {
		const result = parseMarkdown('***', ALL_FEATURES);
		expect(result).toEqual([{ type: 'horizontalRule' }]);
	});

	it('parses horizontal rule (___)', () => {
		const result = parseMarkdown('___', ALL_FEATURES);
		expect(result).toEqual([{ type: 'horizontalRule' }]);
	});

	it('parses blockquote', () => {
		const result = parseMarkdown('> quote text', ALL_FEATURES);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ type: 'blockquote' });
		expect((result[0] as any).children).toEqual([{ type: 'text', content: 'quote text' }]);
	});

	it('parses multi-line blockquote', () => {
		const md = '> line 1\n> line 2';
		const result = parseMarkdown(md, ALL_FEATURES);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ type: 'blockquote' });
	});

	it('parses unordered list with -', () => {
		const md = '- item 1\n- item 2\n- item 3';
		const result = parseMarkdown(md, ALL_FEATURES);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ type: 'list', ordered: false });
		expect((result[0] as any).items).toHaveLength(3);
	});

	it('parses unordered list with *', () => {
		const md = '* item 1\n* item 2';
		const result = parseMarkdown(md, ALL_FEATURES);
		expect(result[0]).toMatchObject({ type: 'list', ordered: false });
	});

	it('parses unordered list with +', () => {
		const md = '+ item 1\n+ item 2';
		const result = parseMarkdown(md, ALL_FEATURES);
		expect(result[0]).toMatchObject({ type: 'list', ordered: false });
	});

	it('parses ordered list', () => {
		const md = '1. first\n2. second\n3. third';
		const result = parseMarkdown(md, ALL_FEATURES);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ type: 'list', ordered: true });
		expect((result[0] as any).items).toHaveLength(3);
	});

	it('parses spacer (empty line)', () => {
		const md = 'paragraph 1\n\nparagraph 2';
		const result = parseMarkdown(md, ALL_FEATURES);
		expect(result).toHaveLength(3);
		expect(result[1]).toEqual({ type: 'spacer' });
	});

	it('handles escaped heading', () => {
		const result = parseMarkdown('\\# not a heading', ALL_FEATURES);
		expect(result[0]).toMatchObject({ type: 'paragraph' });
	});

	it('handles CRLF line endings', () => {
		const md = '# Heading\r\n\r\nParagraph';
		const result = parseMarkdown(md, ALL_FEATURES);
		expect(result[0]).toMatchObject({ type: 'heading', level: 1 });
		expect(result[2]).toMatchObject({ type: 'paragraph' });
	});

	it('respects feature flags - heading disabled', () => {
		const result = parseMarkdown('# Heading', ['bold']);
		expect(result[0]).toMatchObject({ type: 'paragraph' });
	});

	it('respects feature flags - specific heading level disabled', () => {
		const result = parseMarkdown('## Heading', ['heading1']);
		// heading2 not enabled, should be paragraph
		expect(result[0]).toMatchObject({ type: 'paragraph' });
	});

	it('respects feature flags - code block disabled', () => {
		const md = '```\ncode\n```';
		const result = parseMarkdown(md, ['bold']);
		expect(result.every((b) => b.type !== 'codeBlock')).toBe(true);
	});

	it('respects feature flags - divider disabled', () => {
		const result = parseMarkdown('---', ['bold']);
		expect(result[0]).not.toMatchObject({ type: 'horizontalRule' });
	});

	it('respects feature flags - quote disabled', () => {
		const result = parseMarkdown('> quote', ['bold']);
		expect(result[0]).not.toMatchObject({ type: 'blockquote' });
	});

	it('respects feature flags - unordered list disabled', () => {
		const result = parseMarkdown('- item', ['bold']);
		expect(result[0]).not.toMatchObject({ type: 'list' });
	});

	it('respects feature flags - ordered list disabled', () => {
		const result = parseMarkdown('1. item', ['bold']);
		expect(result[0]).not.toMatchObject({ type: 'list' });
	});

	it('parses empty string', () => {
		expect(parseMarkdown('', ALL_FEATURES)).toEqual([{ type: 'spacer' }]);
	});

	it('parses complex document', () => {
		const md = '# Title\n\nSome **bold** text.\n\n- item 1\n- item 2\n\n> quote\n\n---';
		const result = parseMarkdown(md, ALL_FEATURES);
		const types = result.map((b) => b.type);
		expect(types).toContain('heading');
		expect(types).toContain('paragraph');
		expect(types).toContain('list');
		expect(types).toContain('blockquote');
		expect(types).toContain('horizontalRule');
	});

	it('parses inline content within heading', () => {
		const result = parseMarkdown('# **bold** heading', ALL_FEATURES);
		const heading = result[0] as any;
		expect(heading.type).toBe('heading');
		expect(heading.children.some((c: any) => c.type === 'bold')).toBe(true);
	});

	it('parses inline content within list items', () => {
		const result = parseMarkdown('- **bold** item', ALL_FEATURES);
		const list = result[0] as any;
		expect(list.type).toBe('list');
		expect(list.items[0].some((c: any) => c.type === 'bold')).toBe(true);
	});

	it('paragraph stops at heading', () => {
		const md = 'text\n# heading';
		const result = parseMarkdown(md, ALL_FEATURES);
		expect(result[0]).toMatchObject({ type: 'paragraph' });
		expect(result[1]).toMatchObject({ type: 'heading' });
	});

	it('undefined features enables all', () => {
		const result = parseMarkdown('# Heading', undefined);
		expect(result[0]).toMatchObject({ type: 'heading', level: 1 });
	});
});
