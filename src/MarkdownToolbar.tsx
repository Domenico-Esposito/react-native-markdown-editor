import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MarkdownInlineToolbarAction, MarkdownToolbarAction, MarkdownToolbarButtonState, MarkdownToolbarProps } from './markdownCore.types';
import { DEFAULT_MARKDOWN_FEATURES } from './markdownToolbarActions';

const ACTION_LABELS: Record<MarkdownToolbarAction, string> = {
	bold: 'B',
	italic: 'I',
	strikethrough: 'S',
	code: '</>',
	codeBlock: '{ }',
	heading: 'H',
	heading1: 'H1',
	heading2: 'H2',
	heading3: 'H3',
	heading4: 'H4',
	heading5: 'H5',
	heading6: 'H6',
	quote: '"',
	unorderedList: '-',
	orderedList: '1.',
	divider: '-',
	image: '🖼',
};

/**
 * Toolbar component for markdown formatting actions.
 *
 * Can be used in two ways:
 * 1. With `editor` prop from `useMarkdownEditor()` (recommended)
 * 2. With manual `activeInlineActions` + `onPressAction` props
 */
export default function MarkdownToolbar({
	editor,
	features: featuresProp = DEFAULT_MARKDOWN_FEATURES,
	activeInlineActions: activeInlineActionsProp,
	onPressAction: onPressActionProp,
	style,
	buttonStyle,
	buttonTextStyle,
	activeButtonStyle,
	activeButtonTextStyle,
	inactiveButtonStyle,
	inactiveButtonTextStyle,
	renderButton,
}: MarkdownToolbarProps) {
	const features = editor?.features ?? featuresProp;
	const activeInlineActions = editor?.activeInlineActions ?? activeInlineActionsProp ?? [];
	const onPressAction = editor?.handleToolbarAction ?? onPressActionProp;

	return (
		<View style={[styles.container, style]}>
			{features.map((action) => {
				const isImageActive = action === 'image' && editor?.activeImageInfo != null;
				const isActive = isImageActive || (isInlineAction(action) && activeInlineActions.includes(action));
				const label = ACTION_LABELS[action];
				const onPress = () => {
					if (isImageActive) {
						editor?.openImageInfo();
					} else {
						onPressAction?.(action);
					}
				};

				if (renderButton) {
					return (
						<React.Fragment key={action}>
							{renderButton({
								action,
								label,
								active: isActive,
								onPress,
							})}
						</React.Fragment>
					);
				}

				const btnState: MarkdownToolbarButtonState = { action, active: isActive };
				const resolvedButtonStyle = typeof buttonStyle === 'function' ? buttonStyle(btnState) : buttonStyle;
				const resolvedButtonTextStyle = typeof buttonTextStyle === 'function' ? buttonTextStyle(btnState) : buttonTextStyle;

				const stateButtonStyle = isActive ? [styles.buttonActive, activeButtonStyle] : inactiveButtonStyle;
				const stateButtonTextStyle = isActive ? [styles.buttonTextActive, activeButtonTextStyle] : inactiveButtonTextStyle;

				return (
					<Pressable key={action} onPress={onPress} style={[styles.button, resolvedButtonStyle, stateButtonStyle]}>
						<Text style={[styles.buttonText, resolvedButtonTextStyle, stateButtonTextStyle]}>{label}</Text>
					</Pressable>
				);
			})}
		</View>
	);
}

function isInlineAction(action: MarkdownToolbarAction): action is MarkdownInlineToolbarAction {
	return action === 'bold' || action === 'italic' || action === 'strikethrough' || action === 'code';
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginBottom: 12,
	},
	button: {
		borderWidth: 1,
		borderColor: '#c0c0c0',
		borderRadius: 8,
		paddingVertical: 6,
		paddingHorizontal: 10,
		backgroundColor: '#fff',
	},
	buttonActive: {
		backgroundColor: '#2d5eff',
		borderColor: '#2d5eff',
	},
	buttonText: {
		color: '#2d2d2d',
		fontWeight: '600',
	},
	buttonTextActive: {
		color: '#fff',
	},
});
