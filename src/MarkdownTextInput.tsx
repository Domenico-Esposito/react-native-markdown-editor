import * as React from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import type { MarkdownTextInputProps } from './markdownCore.types';
import type { HighlightSegment } from './markdownHighlight.types';
import { DEFAULT_SEGMENT_COMPONENTS, getDefaultSegmentStyle } from './markdownSegmentDefaults';

const isWeb = Platform.OS === 'web';

// ---------------------------------------------------------------------------
// Web helpers – contentEditable with inline syntax highlighting
// ---------------------------------------------------------------------------

function escapeHTML(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function styleToCSS(s: Record<string, any>): string {
	const p: string[] = [];
	if (s.color) p.push(`color:${s.color}`);
	if (s.fontWeight) p.push(`font-weight:${s.fontWeight}`);
	if (s.fontStyle) p.push(`font-style:${s.fontStyle}`);
	if (s.textDecorationLine) p.push(`text-decoration:${s.textDecorationLine}`);
	if (s.fontFamily) p.push(`font-family:${s.fontFamily}`);
	if (s.fontSize != null) p.push(`font-size:${s.fontSize}px`);
	if (s.lineHeight != null) p.push(`line-height:${s.lineHeight}px`);
	if (s.backgroundColor) p.push(`background-color:${s.backgroundColor}`);
	if (s.letterSpacing != null) p.push(`letter-spacing:${s.letterSpacing}px`);
	return p.join(';');
}

function segmentsToHTML(segments: HighlightSegment[]): string {
	const html = segments
		.map((seg) => `<span style="${styleToCSS(getDefaultSegmentStyle(seg.type, seg.meta))}">${escapeHTML(seg.text)}</span>`)
		.join('');
	const lastSeg = segments.length > 0 ? segments[segments.length - 1] : null;
	if (lastSeg && lastSeg.text.endsWith('\n')) {
		return html + '<br data-tail="1">';
	}
	return html;
}

function textOffset(root: Node, target: Node, off: number): number {
	const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	let count = 0;
	let n: Node | null;
	while ((n = tw.nextNode())) {
		if (n === target) return count + off;
		count += (n as Text).length;
	}
	return count;
}

function saveCursor(el: HTMLElement): { start: number; end: number } | null {
	const s = window.getSelection();
	if (!s || !s.rangeCount) return null;
	const r = s.getRangeAt(0);
	if (!el.contains(r.startContainer)) return null;
	return {
		start: textOffset(el, r.startContainer, r.startOffset),
		end: textOffset(el, r.endContainer, r.endOffset),
	};
}

function restoreCursor(el: HTMLElement, pos: { start: number; end: number }) {
	const s = window.getSelection();
	if (!s) return;
	const range = document.createRange();
	const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
	let idx = 0;
	let startSet = false;
	let n: Node | null;
	while ((n = tw.nextNode())) {
		const len = (n as Text).length;
		if (!startSet && idx + len >= pos.start) {
			const offset = pos.start - idx;
			// When cursor is right after a trailing \n in a text node,
			// skip to the next node so the cursor lands on the new line.
			if (offset === len && (n as Text).data.endsWith('\n')) {
				idx += len;
				continue;
			}
			range.setStart(n, offset);
			startSet = true;
		}
		if (startSet && idx + len >= pos.end) {
			range.setEnd(n, pos.end - idx);
			break;
		}
		idx += len;
	}
	if (!startSet) {
		range.selectNodeContents(el);
		range.collapse(false);
	}
	s.removeAllRanges();
	s.addRange(range);
}

function extractText(el: HTMLElement): string {
	let text = '';
	const walk = (node: Node) => {
		if (node.nodeType === Node.TEXT_NODE) {
			text += node.textContent;
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			if ((node as HTMLElement).tagName === 'BR') {
				if (!(node as HTMLElement).hasAttribute('data-tail')) {
					text += '\n';
				}
			} else {
				for (let i = 0; i < node.childNodes.length; i++) walk(node.childNodes[i]);
			}
		}
	};
	walk(el);
	return text;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Pure markdown text input with integrated live preview.
 *
 * Requires an `editor` handle from `useMarkdownEditor()`.
 * Does NOT render a toolbar, use `MarkdownToolbar` separately.
 */
export default function MarkdownTextInput({ editor, style, textInputStyle, segmentComponents, ...textInputProps }: MarkdownTextInputProps) {
	const components = React.useMemo(() => ({ ...DEFAULT_SEGMENT_COMPONENTS, ...segmentComponents }), [segmentComponents]);
	const editableRef = React.useRef<HTMLDivElement>(null);
	const cursorRef = React.useRef<{ start: number; end: number } | null>(null);

	// Web: sync highlighted segments into contentEditable DOM
	// biome-ignore lint: segments is the only meaningful dep
	React.useLayoutEffect(() => {
		if (!isWeb) return;
		const el = editableRef.current;
		if (!el) return;
		const cursor = cursorRef.current ?? saveCursor(el);
		el.innerHTML = segmentsToHTML(editor.highlightedSegments);
		if (cursor) restoreCursor(el, cursor);
		cursorRef.current = null;
	}, [editor.highlightedSegments]);

	// Web: apply programmatic selection from editor (e.g. after toolbar actions)
	React.useEffect(() => {
		if (!isWeb || !editableRef.current || !editor.selection) return;
		restoreCursor(editableRef.current, editor.selection);
	}, [editor.selection]);

	const handleInput = React.useCallback(() => {
		const el = editableRef.current;
		if (!el) return;
		cursorRef.current = saveCursor(el);
		editor.handleChangeText(extractText(el));
	}, [editor.handleChangeText]);

	const handleSelect = React.useCallback(() => {
		const el = editableRef.current;
		if (!el) return;
		const pos = saveCursor(el);
		if (pos) editor.handleSelectionChange({ nativeEvent: { selection: pos } } as any);
	}, [editor.handleSelectionChange]);

	const handleKeyDown = React.useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				const el = editableRef.current;
				if (!el) return;
				const pos = saveCursor(el);
				if (!pos) return;
				const newText = editor.value.slice(0, pos.start) + '\n' + editor.value.slice(pos.end);
				const newCursor = pos.start + 1;
				cursorRef.current = { start: newCursor, end: newCursor };
				editor.handleChangeText(newText);
			}
		},
		[editor.value, editor.handleChangeText],
	);

	const handlePaste = React.useCallback((e: React.ClipboardEvent) => {
		e.preventDefault();
		document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
	}, []);

	const setRef = React.useCallback(
		(el: HTMLDivElement | null) => {
			editableRef.current = el;
			if (editor.inputRef && typeof editor.inputRef === 'object') {
				(editor.inputRef as React.MutableRefObject<any>).current = el;
			}
		},
		[editor.inputRef],
	);

	if (isWeb) {
		return (
			<View style={[styles.editorContainer, style]}>
				<View style={styles.webWrapper}>
					{!editor.value && textInputProps.placeholder ? (
						<div
							style={{
								position: 'absolute' as const,
								top: 10,
								left: 14,
								color: String(textInputProps.placeholderTextColor ?? '#999'),
								fontSize: 16,
								pointerEvents: 'none' as const,
								userSelect: 'none' as const,
							}}
						>
							{textInputProps.placeholder}
						</div>
					) : null}
					<div
						ref={setRef}
						contentEditable
						suppressContentEditableWarning
						onInput={handleInput}
						onSelect={handleSelect}
						onKeyDown={handleKeyDown}
						onPaste={handlePaste}
						style={{
							flex: 1,
							padding: '10px 14px',
							fontSize: 16,
							whiteSpace: 'pre-wrap' as const,
							wordBreak: 'break-word' as const,
							outline: 'none',
							overflowY: 'auto' as const,
							caretColor: '#000',
						}}
					/>
				</View>
			</View>
		);
	}

	return (
		<View style={[styles.editorContainer, style]}>
			<TextInput
				placeholderTextColor="#999"
				{...textInputProps}
				ref={editor.inputRef}
				multiline
				onChangeText={editor.handleChangeText}
				onSelectionChange={editor.handleSelectionChange}
				selection={editor.selection}
				style={[styles.textInput, textInputStyle]}>
				{editor.highlightedSegments.map((segment, index) => {
					const Component = components[segment.type];
					return (
						<Component key={index} type={segment.type} meta={segment.meta}>
							{segment.text}
						</Component>
					);
				})}
			</TextInput>
		</View>
	);
}

const styles = StyleSheet.create({
	editorContainer: {
		gap: 12,
		borderWidth: 1,
		borderColor: '#d7d7d7',
		borderRadius: 12,
		backgroundColor: '#fff',
		minHeight: 140,
		overflow: 'hidden',
	},
	textInput: {
		flex: 1,
		paddingHorizontal: 14,
		paddingVertical: 10,
		textAlignVertical: 'top',
		fontSize: 16,
		includeFontPadding: false,
	},
	webWrapper: {
		flex: 1,
		position: 'relative',
	},
});
