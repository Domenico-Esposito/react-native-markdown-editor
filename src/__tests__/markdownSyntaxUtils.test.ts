import { findUnescapedToken, isEscaped, unescapeMarkdown, parseImageSourceAndTitle, isMarkdownFeatureEnabled, isHeadingLevelEnabled } from '../markdownSyntaxUtils';
import type { MarkdownToolbarAction } from '../markdownCore.types';

// ---------------------------------------------------------------------------
// findUnescapedToken
// ---------------------------------------------------------------------------

describe('findUnescapedToken', () => {
	it('finds a simple token', () => {
		expect(findUnescapedToken('hello **world**', '**', 0)).toBe(6);
	});

	it('returns -1 when token is not present', () => {
		expect(findUnescapedToken('hello world', '**', 0)).toBe(-1);
	});

	it('skips escaped token (preceded by backslash)', () => {
		// In JS: 'hello \\** world **end' → hello \** world **end
		// The \* at index 7 is escaped, so ** at 7 is skipped; next ** is at 16
		expect(findUnescapedToken('hello \\** world **end', '**', 0)).toBe(16);
	});

	it('finds token after double-escaped backslash', () => {
		// \\\\ ** → the backslashes cancel each other; ** is unescaped
		expect(findUnescapedToken('\\\\**rest', '**', 0)).toBe(2);
	});

	it('respects startIndex', () => {
		expect(findUnescapedToken('**hello** world', '**', 2)).toBe(7);
	});

	it('returns -1 for empty token', () => {
		expect(findUnescapedToken('hello', '', 0)).toBe(-1);
	});

	it('returns -1 when startIndex is beyond string', () => {
		expect(findUnescapedToken('hi', '**', 10)).toBe(-1);
	});

	it('finds single-character tokens', () => {
		expect(findUnescapedToken('hello `code` end', '`', 0)).toBe(6);
	});

	it('skips escaped single-character token', () => {
		expect(findUnescapedToken('hello \\` real`', '`', 0)).toBe(13);
	});
});

// ---------------------------------------------------------------------------
// isEscaped
// ---------------------------------------------------------------------------

describe('isEscaped', () => {
	it('returns false when no backslash precedes', () => {
		expect(isEscaped('hello', 2)).toBe(false);
	});

	it('returns true when preceded by single backslash', () => {
		expect(isEscaped('\\*', 1)).toBe(true);
	});

	it('returns false when preceded by double backslash', () => {
		expect(isEscaped('\\\\*', 2)).toBe(false);
	});

	it('returns true when preceded by triple backslash', () => {
		expect(isEscaped('\\\\\\*', 3)).toBe(true);
	});

	it('returns false at index 0', () => {
		expect(isEscaped('hello', 0)).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// unescapeMarkdown
// ---------------------------------------------------------------------------

describe('unescapeMarkdown', () => {
	it('removes backslash before special characters', () => {
		expect(unescapeMarkdown('\\*hello\\*')).toBe('*hello*');
	});

	it('handles multiple escapes', () => {
		expect(unescapeMarkdown('\\*\\*bold\\*\\*')).toBe('**bold**');
	});

	it('handles escaped backslash', () => {
		expect(unescapeMarkdown('hello\\\\world')).toBe('hello\\world');
	});

	it('leaves non-special characters alone', () => {
		expect(unescapeMarkdown('hello world')).toBe('hello world');
	});

	it('handles empty string', () => {
		expect(unescapeMarkdown('')).toBe('');
	});

	it('removes backslash before brackets', () => {
		expect(unescapeMarkdown('\\[link\\]')).toBe('[link]');
	});

	it('removes backslash before parentheses', () => {
		expect(unescapeMarkdown('\\(url\\)')).toBe('(url)');
	});

	it('removes backslash before hash', () => {
		expect(unescapeMarkdown('\\# not heading')).toBe('# not heading');
	});
});

// ---------------------------------------------------------------------------
// parseImageSourceAndTitle
// ---------------------------------------------------------------------------

describe('parseImageSourceAndTitle', () => {
	it('parses a plain URL', () => {
		expect(parseImageSourceAndTitle('http://example.com/img.png')).toEqual({
			src: 'http://example.com/img.png',
		});
	});

	it('parses URL with double-quoted title', () => {
		expect(parseImageSourceAndTitle('img.png "My Title"')).toEqual({
			src: 'img.png',
			title: 'My Title',
		});
	});

	it('parses URL with single-quoted title', () => {
		expect(parseImageSourceAndTitle("img.png 'My Title'")).toEqual({
			src: 'img.png',
			title: 'My Title',
		});
	});

	it('trims whitespace', () => {
		expect(parseImageSourceAndTitle('  img.png  ')).toEqual({
			src: 'img.png',
		});
	});

	it('unescapes src by default', () => {
		expect(parseImageSourceAndTitle('img\\*special.png')).toEqual({
			src: 'img*special.png',
		});
	});

	it('preserves escaped src when unescapeSrc is false', () => {
		expect(parseImageSourceAndTitle('img\\*special.png', { unescapeSrc: false })).toEqual({
			src: 'img\\*special.png',
		});
	});

	it('handles empty title', () => {
		expect(parseImageSourceAndTitle('img.png ""')).toEqual({
			src: 'img.png',
			title: '',
		});
	});
});

// ---------------------------------------------------------------------------
// isMarkdownFeatureEnabled
// ---------------------------------------------------------------------------

describe('isMarkdownFeatureEnabled', () => {
	it('returns true when features is undefined (all enabled)', () => {
		expect(isMarkdownFeatureEnabled(undefined, 'bold')).toBe(true);
	});

	it('returns true when feature is in the list', () => {
		expect(isMarkdownFeatureEnabled(['bold', 'italic'], 'bold')).toBe(true);
	});

	it('returns false when feature is not in the list', () => {
		expect(isMarkdownFeatureEnabled(['bold'], 'italic')).toBe(false);
	});

	it('returns true for heading when heading is in the list', () => {
		expect(isMarkdownFeatureEnabled(['heading'], 'heading')).toBe(true);
	});

	it('returns true for heading when heading1 is in the list', () => {
		expect(isMarkdownFeatureEnabled(['heading1'], 'heading')).toBe(true);
	});

	it('returns true for heading when heading3 is in the list', () => {
		expect(isMarkdownFeatureEnabled(['heading3'], 'heading')).toBe(true);
	});

	it('returns true for heading when heading6 is in the list', () => {
		expect(isMarkdownFeatureEnabled(['heading6'], 'heading')).toBe(true);
	});

	it('returns false for heading when no heading features present', () => {
		expect(isMarkdownFeatureEnabled(['bold', 'italic'], 'heading')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// isHeadingLevelEnabled
// ---------------------------------------------------------------------------

describe('isHeadingLevelEnabled', () => {
	it('returns true when features is undefined', () => {
		expect(isHeadingLevelEnabled(undefined, 1)).toBe(true);
	});

	it('returns true when generic heading is in features', () => {
		const features: MarkdownToolbarAction[] = ['heading'];
		expect(isHeadingLevelEnabled(features, 3)).toBe(true);
	});

	it('returns true when the specific heading level is in features', () => {
		const features: MarkdownToolbarAction[] = ['heading2'];
		expect(isHeadingLevelEnabled(features, 2)).toBe(true);
	});

	it('returns false when a different heading level is in features', () => {
		const features: MarkdownToolbarAction[] = ['heading2'];
		expect(isHeadingLevelEnabled(features, 3)).toBe(false);
	});

	it('returns false when no heading features present', () => {
		const features: MarkdownToolbarAction[] = ['bold', 'italic'];
		expect(isHeadingLevelEnabled(features, 1)).toBe(false);
	});

	it('returns true for all levels when generic heading is present', () => {
		const features: MarkdownToolbarAction[] = ['heading'];
		for (let level = 1; level <= 6; level++) {
			expect(isHeadingLevelEnabled(features, level)).toBe(true);
		}
	});
});
