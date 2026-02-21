import { applyMarkdownToolbarAction, DEFAULT_MARKDOWN_FEATURES } from '../markdownToolbarActions';
import type { MarkdownSelection, MarkdownInlineToolbarAction, MarkdownToolbarAction } from '../markdownCore.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function apply(action: MarkdownToolbarAction, text: string, selection: MarkdownSelection, activeInlineActions: MarkdownInlineToolbarAction[] = []) {
	return applyMarkdownToolbarAction({ action, text, selection, activeInlineActions });
}

// ---------------------------------------------------------------------------
// DEFAULT_MARKDOWN_FEATURES
// ---------------------------------------------------------------------------

describe('DEFAULT_MARKDOWN_FEATURES', () => {
	it('contains all standard features', () => {
		const expected: MarkdownToolbarAction[] = [
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
		for (const f of expected) {
			expect(DEFAULT_MARKDOWN_FEATURES).toContain(f);
		}
	});
});

// ---------------------------------------------------------------------------
// Inline actions: bold
// ---------------------------------------------------------------------------

describe('applyMarkdownToolbarAction – bold', () => {
	it('wraps selected text with **', () => {
		const result = apply('bold', 'hello world', { start: 6, end: 11 });
		expect(result.text).toBe('hello **world**');
		expect(result.selection).toEqual({ start: 8, end: 13 });
	});

	it('inserts opening ** at cursor when not active', () => {
		const result = apply('bold', 'hello', { start: 5, end: 5 });
		expect(result.text).toBe('hello**');
		expect(result.selection).toEqual({ start: 7, end: 7 });
		expect(result.activeInlineActions).toContain('bold');
	});

	it('inserts closing ** at cursor when bold is active', () => {
		const result = apply('bold', 'hello**', { start: 7, end: 7 }, ['bold']);
		expect(result.text).toBe('hello****');
		expect(result.selection).toEqual({ start: 9, end: 9 });
		expect(result.activeInlineActions).not.toContain('bold');
	});

	it('removes bold from activeInlineActions when wrapping selection', () => {
		const result = apply('bold', 'text', { start: 0, end: 4 }, ['bold']);
		expect(result.activeInlineActions).not.toContain('bold');
	});
});

// ---------------------------------------------------------------------------
// Inline actions: italic
// ---------------------------------------------------------------------------

describe('applyMarkdownToolbarAction – italic', () => {
	it('wraps selected text with _', () => {
		const result = apply('italic', 'hello world', { start: 6, end: 11 });
		expect(result.text).toBe('hello _world_');
		expect(result.selection).toEqual({ start: 7, end: 12 });
	});

	it('inserts opening _ at cursor', () => {
		const result = apply('italic', 'hello', { start: 5, end: 5 });
		expect(result.text).toBe('hello_');
		expect(result.activeInlineActions).toContain('italic');
	});

	it('inserts closing _ at cursor when active', () => {
		const result = apply('italic', 'hello_', { start: 6, end: 6 }, ['italic']);
		expect(result.text).toBe('hello__');
		expect(result.activeInlineActions).not.toContain('italic');
	});
});

// ---------------------------------------------------------------------------
// Inline actions: strikethrough
// ---------------------------------------------------------------------------

describe('applyMarkdownToolbarAction – strikethrough', () => {
	it('wraps selected text with ~~', () => {
		const result = apply('strikethrough', 'hello world', { start: 6, end: 11 });
		expect(result.text).toBe('hello ~~world~~');
		expect(result.selection).toEqual({ start: 8, end: 13 });
	});

	it('inserts opening ~~ at cursor', () => {
		const result = apply('strikethrough', 'hello', { start: 5, end: 5 });
		expect(result.text).toBe('hello~~');
		expect(result.activeInlineActions).toContain('strikethrough');
	});
});

// ---------------------------------------------------------------------------
// Inline actions: code
// ---------------------------------------------------------------------------

describe('applyMarkdownToolbarAction – code', () => {
	it('wraps selected text with `', () => {
		const result = apply('code', 'hello world', { start: 6, end: 11 });
		expect(result.text).toBe('hello `world`');
		expect(result.selection).toEqual({ start: 7, end: 12 });
	});

	it('inserts opening ` at cursor', () => {
		const result = apply('code', 'hello', { start: 5, end: 5 });
		expect(result.text).toBe('hello`');
		expect(result.activeInlineActions).toContain('code');
	});
});

// ---------------------------------------------------------------------------
// Block actions: heading
// ---------------------------------------------------------------------------

describe('applyMarkdownToolbarAction – heading', () => {
	it('adds # prefix to line', () => {
		const result = apply('heading', 'hello', { start: 0, end: 0 });
		expect(result.text).toBe('# hello');
	});

	it('removes # prefix when already heading', () => {
		const result = apply('heading', '# hello', { start: 0, end: 0 });
		expect(result.text).toBe('hello');
	});

	it('toggles heading at specific heading levels', () => {
		const result = apply('heading', '### hello', { start: 0, end: 0 });
		expect(result.text).toBe('hello');
	});
});

// ---------------------------------------------------------------------------
// Block actions: heading levels
// ---------------------------------------------------------------------------

describe('applyMarkdownToolbarAction – heading levels', () => {
	it('sets heading1', () => {
		const result = apply('heading1', 'hello', { start: 0, end: 0 });
		expect(result.text).toBe('# hello');
	});

	it('sets heading2', () => {
		const result = apply('heading2', 'hello', { start: 0, end: 0 });
		expect(result.text).toBe('## hello');
	});

	it('sets heading3', () => {
		const result = apply('heading3', 'hello', { start: 0, end: 0 });
		expect(result.text).toBe('### hello');
	});

	it('sets heading4', () => {
		const result = apply('heading4', 'hello', { start: 0, end: 0 });
		expect(result.text).toBe('#### hello');
	});

	it('sets heading5', () => {
		const result = apply('heading5', 'hello', { start: 0, end: 0 });
		expect(result.text).toBe('##### hello');
	});

	it('sets heading6', () => {
		const result = apply('heading6', 'hello', { start: 0, end: 0 });
		expect(result.text).toBe('###### hello');
	});

	it('removes heading when toggling same level', () => {
		const result = apply('heading2', '## hello', { start: 0, end: 0 });
		expect(result.text).toBe('hello');
	});

	it('replaces heading level when switching levels', () => {
		const result = apply('heading3', '## hello', { start: 0, end: 0 });
		expect(result.text).toBe('### hello');
	});
});

// ---------------------------------------------------------------------------
// Block actions: quote
// ---------------------------------------------------------------------------

describe('applyMarkdownToolbarAction – quote', () => {
	it('adds > prefix to line', () => {
		const result = apply('quote', 'hello', { start: 0, end: 0 });
		expect(result.text).toBe('> hello');
	});

	it('removes > prefix when already quoted', () => {
		const result = apply('quote', '> hello', { start: 0, end: 0 });
		expect(result.text).toBe('hello');
	});
});

// ---------------------------------------------------------------------------
// Block actions: unordered list
// ---------------------------------------------------------------------------

describe('applyMarkdownToolbarAction – unorderedList', () => {
	it('adds - prefix to line', () => {
		const result = apply('unorderedList', 'hello', { start: 0, end: 0 });
		expect(result.text).toBe('- hello');
	});

	it('removes - prefix when already a list', () => {
		const result = apply('unorderedList', '- hello', { start: 0, end: 0 });
		expect(result.text).toBe('hello');
	});
});

// ---------------------------------------------------------------------------
// Block actions: ordered list
// ---------------------------------------------------------------------------

describe('applyMarkdownToolbarAction – orderedList', () => {
	it('adds 1. prefix to line', () => {
		const result = apply('orderedList', 'hello', { start: 0, end: 0 });
		expect(result.text).toBe('1. hello');
	});

	it('removes numbered prefix when already ordered', () => {
		const result = apply('orderedList', '1. hello', { start: 0, end: 0 });
		expect(result.text).toBe('hello');
	});

	it('numbers multiple lines sequentially', () => {
		const result = apply('orderedList', 'line1\nline2\nline3', { start: 0, end: 17 });
		expect(result.text).toBe('1. line1\n2. line2\n3. line3');
	});
});

// ---------------------------------------------------------------------------
// Block actions: divider
// ---------------------------------------------------------------------------

describe('applyMarkdownToolbarAction – divider', () => {
	it('replaces line with ---', () => {
		const result = apply('divider', 'hello', { start: 0, end: 0 });
		expect(result.text).toBe('---');
	});

	it('removes --- when already a divider', () => {
		const result = apply('divider', '---', { start: 0, end: 0 });
		expect(result.text).toBe('');
	});
});

// ---------------------------------------------------------------------------
// Block actions: codeBlock
// ---------------------------------------------------------------------------

describe('applyMarkdownToolbarAction – codeBlock', () => {
	it('wraps line in code fences', () => {
		const result = apply('codeBlock', 'code', { start: 0, end: 0 });
		expect(result.text).toBe('```\ncode\n```');
	});

	it('unwraps code fences when already wrapped', () => {
		const result = apply('codeBlock', '```\ncode\n```', { start: 0, end: 11 });
		expect(result.text).toBe('code');
	});
});

// ---------------------------------------------------------------------------
// Image action
// ---------------------------------------------------------------------------

describe('applyMarkdownToolbarAction – image', () => {
	it('inserts image template at cursor', () => {
		const result = apply('image', 'hello', { start: 5, end: 5 });
		expect(result.text).toBe('hello![](url)');
	});

	it('places cursor inside alt brackets', () => {
		const result = apply('image', '', { start: 0, end: 0 });
		expect(result.text).toBe('![](url)');
		expect(result.selection).toEqual({ start: 2, end: 2 });
	});

	it('inserts at middle of text', () => {
		const result = apply('image', 'hello world', { start: 5, end: 5 });
		expect(result.text).toBe('hello![](url) world');
		expect(result.selection).toEqual({ start: 7, end: 7 });
	});
});

// ---------------------------------------------------------------------------
// Selection edge cases
// ---------------------------------------------------------------------------

describe('applyMarkdownToolbarAction – selection edge cases', () => {
	it('handles selection at start of text', () => {
		const result = apply('bold', 'hello', { start: 0, end: 5 });
		expect(result.text).toBe('**hello**');
		expect(result.selection).toEqual({ start: 2, end: 7 });
	});

	it('handles empty text', () => {
		const result = apply('bold', '', { start: 0, end: 0 });
		expect(result.text).toBe('**');
		expect(result.selection).toEqual({ start: 2, end: 2 });
	});

	it('block action on middle line of multiline text', () => {
		const text = 'line1\nline2\nline3';
		// Cursor on line2
		const result = apply('heading1', text, { start: 6, end: 6 });
		expect(result.text).toBe('line1\n# line2\nline3');
	});

	it('preserves activeInlineActions for block actions', () => {
		const result = apply('heading1', 'hello', { start: 0, end: 0 }, ['bold', 'italic']);
		expect(result.activeInlineActions).toEqual(['bold', 'italic']);
	});

	it('preserves activeInlineActions for image action', () => {
		const result = apply('image', 'hello', { start: 0, end: 0 }, ['bold']);
		expect(result.activeInlineActions).toEqual(['bold']);
	});
});
