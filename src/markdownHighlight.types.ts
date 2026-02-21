/**
 * Type definitions for the markdown syntax-highlighting module.
 *
 * Public types (`HighlightSegmentType`, `HighlightSegment`) are re-exported
 * from `index.ts` for consumers who provide custom segment components.
 * Internal types are used only within `markdownHighlight.ts`.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Semantic type of a highlight segment.
 * Exposed to consumers so they can provide custom render components per type.
 */
export type HighlightSegmentType =
	| 'text'
	| 'delimiter'
	| 'heading'
	| 'bold'
	| 'italic'
	| 'strikethrough'
	| 'code'
	| 'codeBlock'
	| 'link'
	| 'linkUrl'
	| 'image'
	| 'quote'
	| 'quoteMarker'
	| 'listMarker'
	| 'horizontalRule';

/** Semantic highlight segment, ready for rendering via segment components. */
export type HighlightSegment = {
	text: string;
	type: HighlightSegmentType;
	/** Optional metadata (e.g. image src, alt, title). */
	meta?: Record<string, string>;
};

// ---------------------------------------------------------------------------
// Internal types (used only inside markdownHighlight.ts)
// ---------------------------------------------------------------------------

/**
 * Semantic type of an inline segment.
 * Internally used to map inline tokens to public segment types.
 */
export type InlineSegmentType = 'text' | 'delimiter' | 'code' | 'link-label' | 'link-url' | 'image-alt';

/**
 * Inline formatting context, propagated recursively
 * through nesting levels (e.g. bold inside italic).
 */
export type InlineContext = {
	bold: boolean;
	italic: boolean;
	strikethrough: boolean;
};

/**
 * Intermediate segment produced by the inline parser.
 * Contains both semantic type and formatting context,
 * which will be combined to produce the final semantic segment.
 */
export type RawInlineSegment = {
	text: string;
	type: InlineSegmentType;
	bold: boolean;
	italic: boolean;
	strikethrough: boolean;
	/** Optional metadata for image segments. */
	meta?: Record<string, string>;
};
