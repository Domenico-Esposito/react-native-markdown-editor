import * as React from 'react';
import { Platform, TextInput } from 'react-native';

import type {
	MarkdownEditorHandle,
	MarkdownImageInfo,
	MarkdownInlineToolbarAction,
	MarkdownSelection,
	MarkdownToolbarAction,
	UseMarkdownEditorOptions,
} from './markdownCore.types';
import { highlightMarkdown } from './markdownHighlight';
import { applyMarkdownToolbarAction, DEFAULT_MARKDOWN_FEATURES } from './markdownToolbarActions';

// Default selection state (cursor at position 0)
const DEFAULT_SELECTION: MarkdownSelection = { start: 0, end: 0 };

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook that manages the shared state between MarkdownTextInput and MarkdownToolbar.
 *
 * Returns a `MarkdownEditorHandle` object to pass as `editor` prop to both components.
 * Handles selection tracking, active inline actions, toolbar action application,
 * and syntax highlighting.
 */
export function useMarkdownEditor({ value, onChangeText, onSelectionChange, onToolbarAction, features }: UseMarkdownEditorOptions): MarkdownEditorHandle {
	// Reference to the TextInput component for programmatic focus and selection
	const inputRef = React.useRef<TextInput>(null);

	// Resolve features with default fallback
	const resolvedFeatures = features ?? DEFAULT_MARKDOWN_FEATURES;

	// Ref to track the current selection (synchronous access needed for event handlers)
	const selectionRef = React.useRef<MarkdownSelection>(DEFAULT_SELECTION);

	// State for current text selection (triggers re-renders when updated)
	const [selection, setSelection] = React.useState<MarkdownSelection>(DEFAULT_SELECTION);

	// Track which inline toolbar actions are currently active (e.g., bold, italic)
	const [activeInlineActions, setActiveInlineActions] = React.useState<MarkdownInlineToolbarAction[]>([]);

	// Flag to suppress selection change events (used during Android toolbar actions)
	const suppressSelectionRef = React.useRef(false);

	// Keep a ref to the current value for synchronous access in callbacks
	const valueRef = React.useRef(value);
	valueRef.current = value;

	/**
	 * Android workaround: forces cursor position after programmatic text changes.
	 * Android fires spurious native onSelectionChange events that override the
	 * desired cursor position - this suppresses them and applies the selection
	 * via setNativeProps across sequential animation frames.
	 */
	const applyAndroidSelection = React.useCallback((targetSelection: MarkdownSelection) => {
		if (Platform.OS !== 'android' || !inputRef.current) return;

		suppressSelectionRef.current = true;
		requestAnimationFrame(() => {
			inputRef.current?.focus();
			requestAnimationFrame(() => {
				if (inputRef.current) {
					inputRef.current.setNativeProps({
						selection: targetSelection,
					});
				}
				requestAnimationFrame(() => {
					suppressSelectionRef.current = false;
				});
			});
		});
	}, []);

	// Parse and highlight the markdown text for syntax highlighting
	const highlightedSegments = React.useMemo(() => highlightMarkdown(value, resolvedFeatures), [value, resolvedFeatures]);

	/**
	 * Detects if the cursor is currently positioned within an image markdown syntax.
	 * Returns image metadata if found, null otherwise.
	 */
	const activeImageInfo = React.useMemo<MarkdownImageInfo | null>(() => {
		const selStart = selection.start;
		const selEnd = selection.end;

		// Search through highlighted segments to find if cursor/selection overlaps an image
		let offset = 0;
		for (const seg of highlightedSegments) {
			const segEnd = offset + seg.text.length;
			if (selStart < segEnd && selEnd > offset && seg.type === 'image' && seg.meta?.src) {
				return {
					src: seg.meta.src,
					alt: seg.meta.alt ?? '',
					title: seg.meta.title,
					start: offset,
					end: segEnd,
				};
			}
			offset = segEnd;
		}
		return null;
	}, [selection, highlightedSegments]);

	/**
	 * Handles text changes in the editor.
	 */
	const handleChangeText = React.useCallback(
		(nextValue: string) => {
			if (nextValue === valueRef.current) return;
			onChangeText(nextValue);
		},
		[onChangeText],
	);

	/**
	 * Handles selection changes in the text input.
	 * Suppressed during Android toolbar actions to prevent spurious events.
	 */
	const handleSelectionChange = React.useCallback(
		(event: { nativeEvent: { selection: MarkdownSelection } }) => {
			// Ignore selection changes when suppression flag is set (Android toolbar actions)
			if (suppressSelectionRef.current) return;

			const nextSelection = event.nativeEvent.selection;
			selectionRef.current = nextSelection;
			setSelection(nextSelection);
			onSelectionChange?.(nextSelection);
		},
		[onSelectionChange],
	);

	/**
	 * Handles toolbar button actions (bold, italic, heading, etc.).
	 * Applies the markdown transformation and manages focus/selection.
	 */
	const handleToolbarAction = React.useCallback(
		(action: MarkdownToolbarAction) => {
			const currentSelection = selectionRef.current;

			// Apply the markdown transformation based on the action
			const result = applyMarkdownToolbarAction({
				action,
				text: value,
				selection: currentSelection,
				activeInlineActions,
			});

			// Update state with the transformation result
			selectionRef.current = result.selection;
			setSelection(result.selection);
			setActiveInlineActions(result.activeInlineActions);
			onChangeText(result.text);
			onSelectionChange?.(result.selection);
			onToolbarAction?.(action, result);

			// Android-specific workaround for selection handling
			if (Platform.OS === 'android') {
				applyAndroidSelection(result.selection);
			} else {
				// iOS: Simply refocus the input
				inputRef.current?.focus();
			}
		},
		[activeInlineActions, onChangeText, onSelectionChange, onToolbarAction, value, applyAndroidSelection],
	);

	// State for the image info modal/popup
	const [imageInfo, setImageInfo] = React.useState<MarkdownImageInfo | null>(null);

	/**
	 * Opens the image info popup for the currently active image.
	 */
	const openImageInfo = React.useCallback(() => {
		if (activeImageInfo) setImageInfo(activeImageInfo);
	}, [activeImageInfo]);

	/**
	 * Closes the image info popup.
	 */
	const dismissImageInfo = React.useCallback(() => {
		setImageInfo(null);
	}, []);

	/**
	 * Deletes the currently active image from the markdown text.
	 * Also removes the trailing newline if present.
	 */
	const deleteActiveImage = React.useCallback(() => {
		if (!activeImageInfo) return;

		const before = value.slice(0, activeImageInfo.start);
		const after = value.slice(activeImageInfo.end);

		// Remove trailing newline if the image is followed by one
		const nextValue = after.startsWith('\n') ? before + after.slice(1) : before + after;

		// Position cursor at the start of where the image was
		const cursor = activeImageInfo.start;
		selectionRef.current = { start: cursor, end: cursor };
		setSelection({ start: cursor, end: cursor });
		setImageInfo(null);
		onChangeText(nextValue);
	}, [activeImageInfo, value, onChangeText]);

	/**
	 * Effect: Clamp selection to valid range when text value shrinks.
	 * Prevents selection indices from being out of bounds.
	 */
	React.useEffect(() => {
		const currentSelection = selectionRef.current;

		// Check if current selection is still valid
		if (currentSelection.start <= value.length && currentSelection.end <= value.length) {
			return;
		}

		// Clamp selection to the maximum valid position
		const safeSelection = {
			start: Math.min(currentSelection.start, value.length),
			end: Math.min(currentSelection.end, value.length),
		};
		selectionRef.current = safeSelection;
		setSelection(safeSelection);
	}, [value.length]);

	/**
	 * Return the editor handle object.
	 * Memoized to maintain stable reference across renders.
	 */
	return React.useMemo(
		() => ({
			features: resolvedFeatures,
			value,
			selection,
			activeInlineActions,
			activeImageInfo,
			imageInfo,
			openImageInfo,
			dismissImageInfo,
			highlightedSegments,
			inputRef,
			handleChangeText,
			handleSelectionChange,
			handleToolbarAction,
			deleteActiveImage,
		}),
		[
			resolvedFeatures,
			value,
			selection,
			activeInlineActions,
			activeImageInfo,
			imageInfo,
			openImageInfo,
			dismissImageInfo,
			highlightedSegments,
			handleChangeText,
			handleSelectionChange,
			handleToolbarAction,
			deleteActiveImage,
		],
	);
}
