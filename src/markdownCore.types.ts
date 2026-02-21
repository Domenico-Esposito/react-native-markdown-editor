import type React from 'react';
import type { ComponentType, ReactNode } from 'react';
import type { StyleProp, TextInputProps, TextStyle, ViewStyle } from 'react-native';
import type { HighlightSegment } from './markdownHighlight.types';
import type { SegmentComponentMap } from './markdownSegment.types';

export type MarkdownTextNode = {
	type: 'text';
	content: string;
};

export type MarkdownBoldNode = {
	type: 'bold';
	children: MarkdownInlineNode[];
};

export type MarkdownItalicNode = {
	type: 'italic';
	children: MarkdownInlineNode[];
};

export type MarkdownInlineCodeNode = {
	type: 'code';
	content: string;
};

export type MarkdownLinkNode = {
	type: 'link';
	href: string;
	children: MarkdownInlineNode[];
};

export type MarkdownStrikethroughNode = {
	type: 'strikethrough';
	children: MarkdownInlineNode[];
};

export type MarkdownImageNode = {
	type: 'image';
	src: string;
	alt: string;
	title?: string;
};

export type MarkdownInlineNode = MarkdownTextNode | MarkdownBoldNode | MarkdownItalicNode | MarkdownStrikethroughNode | MarkdownInlineCodeNode | MarkdownLinkNode | MarkdownImageNode;

export type MarkdownParagraphNode = {
	type: 'paragraph';
	children: MarkdownInlineNode[];
};

export type MarkdownHeadingNode = {
	type: 'heading';
	level: 1 | 2 | 3 | 4 | 5 | 6;
	children: MarkdownInlineNode[];
};

export type MarkdownCodeBlockNode = {
	type: 'codeBlock';
	language?: string;
	content: string;
};

export type MarkdownBlockquoteNode = {
	type: 'blockquote';
	children: MarkdownInlineNode[];
};

export type MarkdownHorizontalRuleNode = {
	type: 'horizontalRule';
};

export type MarkdownSpacerNode = {
	type: 'spacer';
};

export type MarkdownListNode = {
	type: 'list';
	ordered: boolean;
	items: MarkdownInlineNode[][];
};

export type MarkdownListItemNode = {
	type: 'listItem';
	ordered: boolean;
	index: number;
	children: MarkdownInlineNode[];
};

export type MarkdownBlockNode = MarkdownParagraphNode | MarkdownHeadingNode | MarkdownCodeBlockNode | MarkdownBlockquoteNode | MarkdownHorizontalRuleNode | MarkdownSpacerNode | MarkdownListNode;

export type MarkdownRootNode = {
	type: 'root';
	children: MarkdownBlockNode[];
};

export type MarkdownNode = MarkdownInlineNode | MarkdownBlockNode | MarkdownListItemNode | MarkdownRootNode;

export type MarkdownTag =
	| 'root'
	| 'paragraph'
	| 'text'
	| 'heading1'
	| 'heading2'
	| 'heading3'
	| 'heading4'
	| 'heading5'
	| 'heading6'
	| 'bold'
	| 'italic'
	| 'strikethrough'
	| 'inlineCode'
	| 'codeBlock'
	| 'blockquote'
	| 'horizontalRule'
	| 'unorderedList'
	| 'orderedList'
	| 'listItem'
	| 'link'
	| 'image'
	| 'spacer';

/**
 * Common props shared by every custom renderer component.
 * Unlike segment components (editor), renderer components are NOT constrained
 * to Text — they can use View, Image, or any React Native component.
 */
export type RendererBaseProps = {
	children?: ReactNode;
};

export type RootRendererProps = RendererBaseProps & {
	type: 'root';
	style?: StyleProp<ViewStyle>;
};

export type ParagraphRendererProps = RendererBaseProps & {
	type: 'paragraph';
};

export type TextRendererProps = RendererBaseProps & {
	type: 'text';
	text: string;
};

export type HeadingRendererProps<L extends 1 | 2 | 3 | 4 | 5 | 6> = RendererBaseProps & {
	type: `heading${L}`;
	level: L;
};

export type BoldRendererProps = RendererBaseProps & {
	type: 'bold';
};

export type ItalicRendererProps = RendererBaseProps & {
	type: 'italic';
};

export type StrikethroughRendererProps = RendererBaseProps & {
	type: 'strikethrough';
};

export type InlineCodeRendererProps = RendererBaseProps & {
	type: 'inlineCode';
	text: string;
};

export type CodeBlockRendererProps = RendererBaseProps & {
	type: 'codeBlock';
	text: string;
	language?: string;
};

export type BlockquoteRendererProps = RendererBaseProps & {
	type: 'blockquote';
};

export type HorizontalRuleRendererProps = RendererBaseProps & {
	type: 'horizontalRule';
};

export type UnorderedListRendererProps = RendererBaseProps & {
	type: 'unorderedList';
	ordered: false;
};

export type OrderedListRendererProps = RendererBaseProps & {
	type: 'orderedList';
	ordered: true;
};

export type ListItemRendererProps = RendererBaseProps & {
	type: 'listItem';
	ordered: boolean;
	index: number;
};

export type LinkRendererProps = RendererBaseProps & {
	type: 'link';
	href: string;
};

export type ImageRendererProps = RendererBaseProps & {
	type: 'image';
	src: string;
	alt: string;
	title?: string;
};

export type SpacerRendererProps = RendererBaseProps & {
	type: 'spacer';
};

export type RendererPropsByTag = {
	root: RootRendererProps;
	paragraph: ParagraphRendererProps;
	text: TextRendererProps;
	heading1: HeadingRendererProps<1>;
	heading2: HeadingRendererProps<2>;
	heading3: HeadingRendererProps<3>;
	heading4: HeadingRendererProps<4>;
	heading5: HeadingRendererProps<5>;
	heading6: HeadingRendererProps<6>;
	bold: BoldRendererProps;
	italic: ItalicRendererProps;
	strikethrough: StrikethroughRendererProps;
	inlineCode: InlineCodeRendererProps;
	codeBlock: CodeBlockRendererProps;
	blockquote: BlockquoteRendererProps;
	horizontalRule: HorizontalRuleRendererProps;
	unorderedList: UnorderedListRendererProps;
	orderedList: OrderedListRendererProps;
	listItem: ListItemRendererProps;
	link: LinkRendererProps;
	image: ImageRendererProps;
	spacer: SpacerRendererProps;
};

export type RendererComponentProps = RendererPropsByTag[MarkdownTag];

/** Complete map of renderer components (one per tag). Used internally. */
export type MarkdownComponentMap = {
	[K in MarkdownTag]: ComponentType<RendererPropsByTag[K]>;
};

/**
 * Map of custom renderer components keyed by tag.
 * Only the tags you want to override need to be specified;
 * unspecified tags fall back to defaults in `markdownRendererDefaults.tsx`.
 */
export type RendererComponentMap = Partial<{ [K in MarkdownTag]: ComponentType<RendererPropsByTag[K]> }>;

export type MarkdownSelection = {
	start: number;
	end: number;
};

export type MarkdownInlineToolbarAction = 'bold' | 'italic' | 'strikethrough' | 'code';

export type MarkdownBlockToolbarAction =
	| 'heading'
	| 'heading1'
	| 'heading2'
	| 'heading3'
	| 'heading4'
	| 'heading5'
	| 'heading6'
	| 'quote'
	| 'unorderedList'
	| 'orderedList'
	| 'divider'
	| 'codeBlock';

export type MarkdownToolbarAction = MarkdownInlineToolbarAction | MarkdownBlockToolbarAction | 'image';

export type MarkdownToolbarActionResult = {
	text: string;
	selection: MarkdownSelection;
	activeInlineActions: MarkdownInlineToolbarAction[];
};

export type MarkdownRendererProps = {
	markdown: string;
	components?: RendererComponentMap;
	style?: StyleProp<ViewStyle>;
	/**
	 * Enabled markdown features.
	 * When provided, only the corresponding markdown features are rendered;
	 * disabled syntax is treated as plain text.
	 */
	features?: MarkdownToolbarAction[];
};

// ---------------------------------------------------------------------------
// useMarkdownEditor hook
// ---------------------------------------------------------------------------

export type UseMarkdownEditorOptions = {
	/** Current markdown text (controlled). */
	value: string;
	/** Called when the text changes. */
	onChangeText: (nextValue: string) => void;
	/** Called when the cursor/selection changes. */
	onSelectionChange?: (selection: MarkdownSelection) => void;
	/** Called after a toolbar action is applied. */
	onToolbarAction?: (action: MarkdownToolbarAction, result: MarkdownToolbarActionResult) => void;
	/**
	 * Enabled markdown features.
	 * Controls which toolbar buttons appear AND which syntax is highlighted
	 * in MarkdownTextInput. Defaults to all features when omitted.
	 */
	features?: MarkdownToolbarAction[];
};

/**
 * Shared editor state returned by `useMarkdownEditor`.
 * Pass as `editor` prop to both `MarkdownTextInput` and `MarkdownToolbar`.
 */
export type MarkdownEditorHandle = {
	/** Enabled markdown features. */
	features: MarkdownToolbarAction[];
	/** Current text value. */
	value: string;
	/** Current cursor/selection range. */
	selection: MarkdownSelection;
	/** Currently active inline formatting actions. */
	activeInlineActions: MarkdownInlineToolbarAction[];
	/** Image info when cursor is on an image segment, null otherwise. */
	activeImageInfo: MarkdownImageInfo | null;
	/** Image info set by the toolbar when the user taps the image button (modal state). */
	imageInfo: MarkdownImageInfo | null;
	/** Sets `imageInfo` to the current `activeImageInfo`. Called internally by the toolbar. */
	openImageInfo: () => void;
	/** Clears `imageInfo` (closes the modal). */
	dismissImageInfo: () => void;
	/** Highlighted segments for live preview rendering. */
	highlightedSegments: HighlightSegment[];
	/** Ref to the underlying TextInput. */
	inputRef: React.RefObject<import('react-native').TextInput | null>;
	/** Internal handler - consumed by MarkdownTextInput. */
	handleChangeText: (nextValue: string) => void;
	/** Internal handler - consumed by MarkdownTextInput. */
	handleSelectionChange: (event: { nativeEvent: { selection: MarkdownSelection } }) => void;
	/** Handler for toolbar action presses - consumed by MarkdownToolbar. */
	handleToolbarAction: (action: MarkdownToolbarAction) => void;
	/** Removes the image markdown at the current cursor position (if any). */
	deleteActiveImage: () => void;
};

// ---------------------------------------------------------------------------
// Component props
// ---------------------------------------------------------------------------

export type MarkdownToolbarButtonState = {
	action: MarkdownToolbarAction;
	active: boolean;
};

export type MarkdownToolbarProps = {
	/** Shared editor state from useMarkdownEditor. */
	editor?: MarkdownEditorHandle;
	features?: MarkdownToolbarAction[];
	activeInlineActions?: MarkdownInlineToolbarAction[];
	onPressAction?: (action: MarkdownToolbarAction) => void;
	/** Style for the toolbar container. */
	style?: StyleProp<ViewStyle>;
	/** Static style applied to every button, or a function receiving button state for per-button styling. */
	buttonStyle?: StyleProp<ViewStyle> | ((state: MarkdownToolbarButtonState) => StyleProp<ViewStyle>);
	/** Static text style applied to every button, or a function receiving button state for per-button styling. */
	buttonTextStyle?: StyleProp<TextStyle> | ((state: MarkdownToolbarButtonState) => StyleProp<TextStyle>);
	/** Additional style merged when a button is active. */
	activeButtonStyle?: StyleProp<ViewStyle>;
	/** Additional text style merged when a button is active. */
	activeButtonTextStyle?: StyleProp<TextStyle>;
	/** Additional style merged when a button is inactive. */
	inactiveButtonStyle?: StyleProp<ViewStyle>;
	/** Additional text style merged when a button is inactive. */
	inactiveButtonTextStyle?: StyleProp<TextStyle>;
	renderButton?: (params: { action: MarkdownToolbarAction; label: string; active: boolean; onPress: () => void }) => ReactNode;
};

export type MarkdownImageInfo = {
	src: string;
	alt: string;
	title?: string;
	/** Start character offset of the image markdown in the text. */
	start: number;
	/** End character offset of the image markdown in the text. */
	end: number;
};

export type MarkdownTextInputProps = Omit<TextInputProps, 'value' | 'onChangeText' | 'onSelectionChange' | 'multiline'> & {
	/** Shared editor state from useMarkdownEditor. */
	editor: MarkdownEditorHandle;
	/** Style for the outer container View. */
	style?: StyleProp<ViewStyle>;
	/** Style for the inner TextInput. */
	textInputStyle?: StyleProp<TextStyle>;
	/**
	 * Custom components to render specific segment types.
	 * Each component must be or extend React Native's Text.
	 * Unspecified types fall back to the default Text renderer.
	 */
	segmentComponents?: SegmentComponentMap;
};
