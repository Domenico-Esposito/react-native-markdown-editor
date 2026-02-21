import * as React from 'react';
import { Text } from 'react-native';
import type { TextStyle } from 'react-native';

import type { HighlightSegmentType } from './markdownHighlight.types';
import type { SegmentComponentProps } from './markdownSegment.types';

// ---------------------------------------------------------------------------
// Default styling values
// ---------------------------------------------------------------------------

const COLOR_TEXT = '#1f1f1f';
const COLOR_DELIMITER = '#a0a0a0';
const COLOR_CODE = '#c7254e';
const COLOR_CODE_BG = '#f9f2f4';
const COLOR_LINK = '#2d5eff';
const COLOR_LINK_URL = '#8a8a8a';
const COLOR_IMAGE = '#2d5eff';
const COLOR_QUOTE = '#6a737d';
const COLOR_QUOTE_MARKER = '#a0a0a0';
const COLOR_LIST_MARKER = '#2d5eff';
const COLOR_HORIZONTAL_RULE = '#a0a0a0';

const FONT_SIZE = 16;
const FONT_SIZE_HEADING = Math.round(FONT_SIZE * 1.75);
const FONT_SIZE_CODE = Math.round(FONT_SIZE * 0.875);
const LINE_HEIGHT = computeLineHeight(FONT_SIZE);
const LINE_HEIGHT_CODE = computeLineHeight(FONT_SIZE_CODE);

function computeLineHeight(fontSize: number): number {
	return Math.ceil(fontSize * 1.5);
}

function getHeadingFontSize(level: number): number {
	if (level < 1 || level > 6) return FONT_SIZE;
	const t = (level - 1) / 5;
	return Math.round(FONT_SIZE_HEADING + t * (FONT_SIZE - FONT_SIZE_HEADING));
}

function getHeadingMetrics(meta?: Record<string, string>) {
	const level = Number.parseInt(meta?.headingLevel ?? '1', 10);
	const fontSize = getHeadingFontSize(Number.isNaN(level) ? 1 : level);
	return {
		fontSize,
		lineHeight: computeLineHeight(fontSize),
	};
}

export function getDefaultSegmentStyle(type: HighlightSegmentType, meta?: Record<string, string>): TextStyle {
	const style: TextStyle = {
		color: COLOR_TEXT,
		fontSize: FONT_SIZE,
		lineHeight: LINE_HEIGHT,
		includeFontPadding: false,
	};

	switch (type) {
		case 'delimiter':
			style.color = COLOR_DELIMITER;
			break;
		case 'heading':
			style.fontWeight = 'bold';
			break;
		case 'bold':
			style.fontWeight = 'bold';
			break;
		case 'italic':
			style.fontStyle = 'italic';
			break;
		case 'strikethrough':
			style.textDecorationLine = 'line-through';
			break;
		case 'code':
			style.color = COLOR_CODE;
			style.backgroundColor = COLOR_CODE_BG;
			style.fontFamily = 'Courier';
			style.fontSize = FONT_SIZE_CODE;
			style.lineHeight = LINE_HEIGHT_CODE;
			break;
		case 'codeBlock':
			style.color = COLOR_CODE;
			style.fontFamily = 'Courier';
			style.fontSize = FONT_SIZE_CODE;
			style.lineHeight = LINE_HEIGHT_CODE;
			break;
		case 'link':
			style.color = COLOR_LINK;
			break;
		case 'linkUrl':
			style.color = COLOR_LINK_URL;
			break;
		case 'image':
			style.color = COLOR_IMAGE;
			break;
		case 'quote':
			style.color = COLOR_QUOTE;
			break;
		case 'quoteMarker':
			style.color = COLOR_QUOTE_MARKER;
			break;
		case 'listMarker':
			style.color = COLOR_LIST_MARKER;
			style.fontWeight = 'bold';
			break;
		case 'horizontalRule':
			style.color = COLOR_HORIZONTAL_RULE;
			style.letterSpacing = 4;
			style.textAlign = 'center';
			break;
		case 'text':
		default:
			break;
	}

	const lineContext = meta?.lineContext;
	if (lineContext === 'heading') {
		const { fontSize, lineHeight } = getHeadingMetrics(meta);
		style.fontSize = fontSize;
		style.lineHeight = lineHeight;
		style.fontWeight = 'bold';
	}

	if (lineContext === 'quote' && (type === 'text' || type === 'bold' || type === 'italic' || type === 'strikethrough')) {
		style.color = COLOR_QUOTE;
	}

	if (lineContext === 'codeFence' && type === 'delimiter') {
		style.fontSize = FONT_SIZE_CODE;
		style.lineHeight = LINE_HEIGHT_CODE;
	}

	return style;
}

// ---------------------------------------------------------------------------
// Default components
// ---------------------------------------------------------------------------

/** Default renderer - a plain Text with the default style for the segment type. */
function DefaultTextSegment({ type, meta, children }: SegmentComponentProps) {
	return <Text style={getDefaultSegmentStyle(type, meta)}>{children}</Text>;
}

export const DefaultSegment = DefaultTextSegment;

/** Default bold - renders bold text. */
export const DefaultBoldSegment = DefaultTextSegment;

/** Default heading - renders heading text. */
export const DefaultHeadingSegment = DefaultTextSegment;

/** Default italic - renders italic text. */
export const DefaultItalicSegment = DefaultTextSegment;

/** Default strikethrough - renders strikethrough text. */
export const DefaultStrikethroughSegment = DefaultTextSegment;

/** Default inline code - renders code text. */
export const DefaultCodeSegment = DefaultTextSegment;

/** Default code block - renders code block content. */
export const DefaultCodeBlockSegment = DefaultTextSegment;

/** Default link label - renders link text. */
export const DefaultLinkSegment = DefaultTextSegment;

/** Default link URL - renders link URL text. */
export const DefaultLinkUrlSegment = DefaultTextSegment;

/** Default image - renders image markdown text. */
export const DefaultImageSegment = DefaultTextSegment;

/** Default blockquote - renders quote text. */
export const DefaultQuoteSegment = DefaultTextSegment;

/** Default quote marker - renders the > character. */
export const DefaultQuoteMarkerSegment = DefaultTextSegment;

/** Default delimiter - renders markdown syntax characters. */
export const DefaultDelimiterSegment = DefaultTextSegment;

/** Default list marker - renders list bullet/number. */
export const DefaultListMarkerSegment = DefaultTextSegment;

/** Default horizontal rule - renders the rule markers (---, ***, ___). */
export const DefaultHorizontalRuleSegment = DefaultTextSegment;

/**
 * Complete map of default segment components.
 * Used as fallback when no custom component is provided for a type.
 */
export const DEFAULT_SEGMENT_COMPONENTS: Record<HighlightSegmentType, React.ComponentType<SegmentComponentProps>> = {
	text: DefaultSegment,
	delimiter: DefaultDelimiterSegment,
	heading: DefaultHeadingSegment,
	bold: DefaultBoldSegment,
	italic: DefaultItalicSegment,
	strikethrough: DefaultStrikethroughSegment,
	code: DefaultCodeSegment,
	codeBlock: DefaultCodeBlockSegment,
	link: DefaultLinkSegment,
	linkUrl: DefaultLinkUrlSegment,
	image: DefaultImageSegment,
	quote: DefaultQuoteSegment,
	quoteMarker: DefaultQuoteMarkerSegment,
	listMarker: DefaultListMarkerSegment,
	horizontalRule: DefaultHorizontalRuleSegment,
};
