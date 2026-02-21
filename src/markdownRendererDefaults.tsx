/**
 * Default component implementations and styles for {@link MarkdownRenderer}.
 *
 * Each markdown tag has a corresponding default component that provides
 * basic visual styling. Consumers can override any subset via the
 * `components` prop on `MarkdownRenderer`.
 */

import * as React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import type { MarkdownComponentMap } from './markdownCore.types';

// ---------------------------------------------------------------------------
// Default components
// ---------------------------------------------------------------------------

const DefaultRoot: MarkdownComponentMap['root'] = ({ children, style }) => <View style={[styles.root, style]}>{children}</View>;

const DefaultParagraph: MarkdownComponentMap['paragraph'] = ({ children }) => <Text style={styles.paragraph}>{children}</Text>;

const DefaultText: MarkdownComponentMap['text'] = ({ children }) => <Text>{children}</Text>;

const DefaultHeading1: MarkdownComponentMap['heading1'] = ({ children }) => <Text style={styles.heading1}>{children}</Text>;

const DefaultHeading2: MarkdownComponentMap['heading2'] = ({ children }) => <Text style={styles.heading2}>{children}</Text>;

const DefaultHeading3: MarkdownComponentMap['heading3'] = ({ children }) => <Text style={styles.heading3}>{children}</Text>;

const DefaultHeading4: MarkdownComponentMap['heading4'] = ({ children }) => <Text style={styles.heading4}>{children}</Text>;

const DefaultHeading5: MarkdownComponentMap['heading5'] = ({ children }) => <Text style={styles.heading5}>{children}</Text>;

const DefaultHeading6: MarkdownComponentMap['heading6'] = ({ children }) => <Text style={styles.heading6}>{children}</Text>;

const DefaultBold: MarkdownComponentMap['bold'] = ({ children }) => <Text style={styles.bold}>{children}</Text>;

const DefaultItalic: MarkdownComponentMap['italic'] = ({ children }) => <Text style={styles.italic}>{children}</Text>;

const DefaultStrikethrough: MarkdownComponentMap['strikethrough'] = ({ children }) => <Text style={styles.strikethrough}>{children}</Text>;

const DefaultInlineCode: MarkdownComponentMap['inlineCode'] = ({ children }) => <Text style={styles.inlineCode}>{children}</Text>;

const DefaultCodeBlock: MarkdownComponentMap['codeBlock'] = ({ text, language }) => (
	<View style={styles.codeBlock}>
		<Text style={styles.codeBlockLanguage}>{language?.trim() || 'Code'}</Text>
		<Text style={styles.codeBlockText}>{text}</Text>
	</View>
);

const DefaultBlockquote: MarkdownComponentMap['blockquote'] = ({ children }) => <View style={styles.blockquote}>{children}</View>;

const DefaultHorizontalRule: MarkdownComponentMap['horizontalRule'] = () => <View style={styles.horizontalRule} />;

const DefaultSpacer: MarkdownComponentMap['spacer'] = () => <View style={styles.spacer} />;

const DefaultUnorderedList: MarkdownComponentMap['unorderedList'] = ({ children }) => <View style={styles.list}>{children}</View>;

const DefaultOrderedList: MarkdownComponentMap['orderedList'] = ({ children }) => <View style={styles.list}>{children}</View>;

const DefaultListItem: MarkdownComponentMap['listItem'] = ({ children }) => <View style={styles.listItem}>{children}</View>;

const DefaultLink: MarkdownComponentMap['link'] = ({ children }) => <Text style={styles.link}>{children}</Text>;

const DefaultImage: MarkdownComponentMap['image'] = ({ src, alt, title }) => (
	<View style={styles.imageContainer}>
		<Image source={{ uri: src }} style={styles.image} resizeMode="contain" accessibilityLabel={alt ?? title} />
		{alt ? <Text style={styles.imageAlt}>{alt}</Text> : null}
	</View>
);

// ---------------------------------------------------------------------------
// Component map
// ---------------------------------------------------------------------------

/** Complete map of default markdown rendering components. */
export const DEFAULT_COMPONENTS: MarkdownComponentMap = {
	root: DefaultRoot,
	paragraph: DefaultParagraph,
	text: DefaultText,
	heading1: DefaultHeading1,
	heading2: DefaultHeading2,
	heading3: DefaultHeading3,
	heading4: DefaultHeading4,
	heading5: DefaultHeading5,
	heading6: DefaultHeading6,
	bold: DefaultBold,
	italic: DefaultItalic,
	strikethrough: DefaultStrikethrough,
	inlineCode: DefaultInlineCode,
	codeBlock: DefaultCodeBlock,
	blockquote: DefaultBlockquote,
	horizontalRule: DefaultHorizontalRule,
	unorderedList: DefaultUnorderedList,
	orderedList: DefaultOrderedList,
	listItem: DefaultListItem,
	link: DefaultLink,
	image: DefaultImage,
	spacer: DefaultSpacer,
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

export const styles = StyleSheet.create({
	root: {
		gap: 8,
	},
	paragraph: {
		color: '#1f1f1f',
		lineHeight: 22,
	},
	heading1: {
		fontSize: 30,
		fontWeight: '700',
	},
	heading2: {
		fontSize: 26,
		fontWeight: '700',
	},
	heading3: {
		fontSize: 22,
		fontWeight: '700',
	},
	heading4: {
		fontSize: 20,
		fontWeight: '700',
	},
	heading5: {
		fontSize: 18,
		fontWeight: '700',
	},
	heading6: {
		fontSize: 16,
		fontWeight: '700',
	},
	bold: {
		fontWeight: '700',
	},
	italic: {
		fontStyle: 'italic',
	},
	strikethrough: {
		textDecorationLine: 'line-through' as const,
	},
	inlineCode: {
		fontFamily: 'Courier',
		backgroundColor: '#f1f1f1',
		paddingHorizontal: 4,
		borderRadius: 4,
	},
	codeBlock: {
		backgroundColor: '#f1f1f1',
		borderRadius: 8,
		padding: 12,
	},
	codeBlockLanguage: {
		alignSelf: 'flex-start',
		fontSize: 11,
		fontWeight: '700',
		backgroundColor: '#e2e2e2',
		borderRadius: 4,
		paddingHorizontal: 6,
		paddingVertical: 2,
		marginBottom: 8,
	},
	codeBlockText: {
		fontFamily: 'Courier',
	},
	blockquote: {
		borderLeftWidth: 3,
		borderLeftColor: '#acacac',
		paddingLeft: 10,
	},
	horizontalRule: {
		borderBottomWidth: 1,
		borderBottomColor: '#d0d0d0',
		marginVertical: 8,
	},
	list: {
		gap: 4,
	},
	listItem: {
		flexDirection: 'row',
	},
	link: {
		color: '#2d5eff',
		textDecorationLine: 'underline',
	},
	image: {
		width: '100%',
		height: 200,
	},
	imageContainer: {
		alignItems: 'center',
	},
	imageAlt: {
		fontSize: 12,
		color: '#6b6b6b',
		marginTop: 4,
		textAlign: 'center',
	},
	spacer: {
		height: 8,
	},
});
