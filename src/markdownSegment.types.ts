import type { ComponentType, ReactNode } from 'react';

import type { HighlightSegmentType } from './markdownHighlight.types';

/**
 * Props received by every custom segment component.
 * The component MUST render a Text (or a component that inherits from Text),
 * since segments are children of a TextInput.
 */
export type SegmentComponentProps = {
	/** Semantic type of the segment (e.g. 'bold', 'heading', 'code'). */
	type: HighlightSegmentType;
	/** Optional metadata emitted by the highlighter (e.g. heading level, image info). */
	meta?: Record<string, string>;
	/** The segment text content. */
	children: ReactNode;
};

/**
 * Map of custom components keyed by segment type.
 * Only the types you want to override need to be specified;
 * unspecified types fall back to defaults.
 */
export type SegmentComponentMap = Partial<Record<HighlightSegmentType, ComponentType<SegmentComponentProps>>>;
