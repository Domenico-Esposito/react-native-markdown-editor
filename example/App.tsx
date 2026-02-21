import * as React from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MarkdownTextInput, MarkdownToolbar, MarkdownRenderer, useMarkdownEditor } from 'react-native-markdown-editor';
import type {
	BlockquoteRendererProps,
	BoldRendererProps,
	InlineCodeRendererProps,
	RendererComponentMap,
	SegmentComponentMap,
	SegmentComponentProps,
	MarkdownEditorHandle,
} from 'react-native-markdown-editor';

const initialValue = `# Features
- **Bold**: Use **double asterisks** or __double underscores__
- _Italic_: Use *single asterisks* or _single underscores_
- ~~Strikethrough~~: Use double tildes

## Headings
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

## Code
\`\`\`javascript
function greet(name) {
	console.log('Hello, '+name+'!');
}
\`\`\`

Inline code: \`const x = 10;\`

## Images
![The San Juan Mountains are beautiful](https://www.markdownguide.org/assets/images/generated/assets/images/san-juan-mountains-1080.webp "San Juan Mountains")

## Lists
- First item
- Second item
- Third item

1. First item
2. Second item
3. Third item

## Quotes
> This is a blockquote

## Escape Characters
1\\. This won't be a list item
\\- This won't be a list item either
\\# This hash won't create a heading
\\> This won't be a blockquote`;

// ---------------------------------------------------------------------------
// Custom segment components (must render Text or Text-based components)
// ---------------------------------------------------------------------------

function CustomBoldSegment({ children }: SegmentComponentProps) {
	return <Text style={segmentStyles.bold}>{children}</Text>;
}

function CustomCodeSegment({ children }: SegmentComponentProps) {
	return <Text style={segmentStyles.code}>{children}</Text>;
}

function CustomQuoteMarkerSegment({ children }: SegmentComponentProps) {
	return <Text style={segmentStyles.quoteMarker}>{children}</Text>;
}

const customSegmentComponents: SegmentComponentMap = {
	bold: CustomBoldSegment,
	code: CustomCodeSegment,
	codeBlock: CustomCodeSegment,
	quoteMarker: CustomQuoteMarkerSegment,
};

const segmentStyles = StyleSheet.create({
	bold: { color: '#fff', backgroundColor: '#5d6c9a', fontWeight: '700' },
	code: { backgroundColor: '#e8f5e9', color: '#2e7d32', fontSize: 14 },
	quoteMarker: { fontStyle: 'italic', color: 'red', borderLeftColor: 'red' },
});

// ---------------------------------------------------------------------------
// Custom renderer components (no Text constraint — can use View, etc.)
// ---------------------------------------------------------------------------

function CustomBoldRenderer({ children }: BoldRendererProps) {
	return <Text style={rendererStyles.bold}>{children}</Text>;
}

function CustomInlineCodeRenderer({ children }: InlineCodeRendererProps) {
	return <Text style={rendererStyles.inlineCode}>{children}</Text>;
}

function CustomBlockquoteRenderer({ children }: BlockquoteRendererProps) {
	return (
		<View style={rendererStyles.blockquoteContainer}>
			<Text style={rendererStyles.blockquoteText}>{children}</Text>
		</View>
	);
}

const customRendererComponents: RendererComponentMap = {
	bold: CustomBoldRenderer,
	inlineCode: CustomInlineCodeRenderer,
	blockquote: CustomBlockquoteRenderer,
};

const rendererStyles = StyleSheet.create({
	bold: { color: '#fff', backgroundColor: '#5d6c9a', fontWeight: '700' },
	inlineCode: { fontFamily: 'Courier', backgroundColor: '#e8f5e9', color: '#2e7d32', paddingHorizontal: 4, borderRadius: 4 },
	blockquoteContainer: { borderRadius: 5, borderLeftWidth: 3, borderLeftColor: '#5b5b5b', paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#e5e5e5' },
	blockquoteText: { fontStyle: 'italic', color: '#5b5b5b' },
});

// ---------------------------------------------------------------------------
// Image info modal
// ---------------------------------------------------------------------------

interface ImageInfoModalProps {
	editor: MarkdownEditorHandle;
}

function ImageInfoModal({ editor }: ImageInfoModalProps) {
	const handleDelete = React.useCallback(() => {
		editor.deleteActiveImage();
	}, [editor]);

	return (
		<Modal visible={editor.imageInfo !== null} transparent animationType="slide" onRequestClose={editor.dismissImageInfo}>
			<View style={styles.modalOverlay}>
				<View style={styles.modalContent}>
					<Text style={styles.modalTitle}>Image</Text>
					<Text style={styles.modalLabel}>
						Alt: <Text style={styles.modalValue}>{editor.imageInfo?.alt}</Text>
					</Text>
					<Text style={styles.modalLabel}>
						URL: <Text style={styles.modalValue}>{editor.imageInfo?.src}</Text>
					</Text>
					{editor.imageInfo?.title ? (
						<Text style={styles.modalLabel}>
							Title: <Text style={styles.modalValue}>{editor.imageInfo.title}</Text>
						</Text>
					) : null}
					{editor.imageInfo?.src ? <Image source={{ uri: editor.imageInfo.src }} style={styles.modalImage} resizeMode="contain" /> : null}
					<View style={styles.modalButtons}>
						<Pressable style={styles.modalDeleteButton} onPress={handleDelete}>
							<Text style={styles.modalDeleteText}>Delete Image</Text>
						</Pressable>
						<Pressable style={styles.modalCloseButton} onPress={editor.dismissImageInfo}>
							<Text style={styles.modalCloseText}>Close</Text>
						</Pressable>
					</View>
				</View>
			</View>
		</Modal>
	);
}

export default function App() {
	const [value, setValue] = React.useState(initialValue);
	const [showRenderer, setShowRenderer] = React.useState(false);

	const editor = useMarkdownEditor({
		value,
		onChangeText: setValue,
	});

	return (
		<SafeAreaProvider>
			<SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
				<KeyboardAvoidingView style={styles.keyboardAvoiding} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
					<ScrollView keyboardShouldPersistTaps="always" contentContainerStyle={styles.content}>
						<Text style={styles.title}>React Native Markdown Editor</Text>

						<Pressable style={styles.toggleButton} onPress={() => setShowRenderer((prev) => !prev)}>
							<Text style={styles.toggleButtonText}>{showRenderer ? 'Show Editor' : 'Show Renderer'}</Text>
						</Pressable>

						{showRenderer ? (
							<View style={styles.rendererWrapper}>
								<MarkdownRenderer markdown={value} components={customRendererComponents} />
							</View>
						) : (
							<View style={styles.editorWrapper}>
								<MarkdownToolbar
									editor={editor}
									style={styles.toolbar}
									buttonStyle={({ action, active }) => [styles.customButton, action === 'bold' && styles.boldButton, active && styles.activeButton]}
									buttonTextStyle={({ active }) => [styles.customButtonText, active && styles.activeButtonText]}
									inactiveButtonStyle={styles.inactiveButton}
									inactiveButtonTextStyle={styles.inactiveButtonText}
								/>
								<MarkdownTextInput
									editor={editor}
									autoCorrect={false}
									autoCapitalize="none"
									placeholder="Write markdown..."
									style={styles.inputContainer}
									textInputStyle={styles.input}
									segmentComponents={customSegmentComponents}
								/>
							</View>
						)}
					</ScrollView>
				</KeyboardAvoidingView>

				<ImageInfoModal editor={editor} />
			</SafeAreaView>
		</SafeAreaProvider>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f4f4f4',
	},
	keyboardAvoiding: {
		flex: 1,
	},
	content: {
		padding: 16,
		gap: 12,
	},
	title: {
		fontSize: 28,
		fontWeight: '700',
	},
	editorWrapper: {
		gap: 12,
	},
	rendererWrapper: {
		backgroundColor: '#fff',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#d0d0d0',
		padding: 12,
	},
	toggleButton: {
		alignSelf: 'flex-start',
		backgroundColor: '#2d5eff',
		borderRadius: 10,
		paddingVertical: 8,
		paddingHorizontal: 16,
	},
	toggleButtonText: {
		color: '#fff',
		fontWeight: '700',
		fontSize: 14,
	},
	toolbar: {
		marginBottom: 0,
	},
	customButton: {
		borderRadius: 12,
		paddingVertical: 8,
		paddingHorizontal: 14,
		borderWidth: 1,
		borderColor: '#d0d0d0',
		backgroundColor: '#fff',
	},
	boldButton: {
		borderWidth: 2,
	},
	activeButton: {
		backgroundColor: '#2d5eff',
		borderColor: '#2d5eff',
	},
	activeButtonText: {
		color: '#fff',
		fontWeight: '800',
	},
	inactiveButton: {
		opacity: 0.6,
	},
	inactiveButtonText: {
		color: '#666',
	},
	customButtonText: {
		fontSize: 15,
		fontWeight: '600',
	},
	inputContainer: {
		backgroundColor: '#fff',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#d0d0d0',
		padding: 12,
	},
	input: {
		minHeight: 180,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		padding: 24,
	},
	modalContent: {
		backgroundColor: '#fff',
		borderRadius: 16,
		padding: 20,
		gap: 8,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: '700',
		marginBottom: 4,
	},
	modalLabel: {
		fontSize: 14,
		fontWeight: '600',
		color: '#555',
	},
	modalValue: {
		fontWeight: '400',
		color: '#1f1f1f',
	},
	modalImage: {
		width: '100%',
		height: 200,
		borderRadius: 8,
		marginTop: 8,
	},
	modalCloseText: {
		color: '#fff',
		fontWeight: '700',
		fontSize: 15,
	},
	modalButtons: {
		marginTop: 16,
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 12,
	},
	modalDeleteButton: {
		backgroundColor: '#ff3b30',
		borderRadius: 10,
		paddingVertical: 10,
		paddingHorizontal: 24,
	},
	modalDeleteText: {
		color: '#fff',
		fontSize: 15,
		fontWeight: '700',
	},
	modalCloseButton: {
		backgroundColor: '#2d5eff',
		borderRadius: 10,
		paddingVertical: 10,
		paddingHorizontal: 24,
	},
});
