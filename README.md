# React Native Markdown Editor

A fully native Markdown editor for React Native with real-time syntax highlighting.

## Features

- 📝 **Real-time Syntax Highlighting**: Text is parsed and styled as you type.
- ⚡️ **Native Performance**: Uses native components (`TextInput` with _attributed strings_) on iOS and Android, and `contentEditable` with inline syntax highlighting on Web.
- 🧩 **Customizable Components**: You can replace segment renderers (`bold`, `heading`, `code`, etc.) with your own components.
- 🛠 **Built-in Toolbar**: Buttons for quick formatting (bold, italic, lists, etc.) and extensible.
- 🖼 **Image Support**: Insert, edit, and remove images via toolbar and programmatic API.
- 📄 **Read-Only Renderer**: `MarkdownRenderer` component to display markdown without editing.
- 📱 **Cross-Platform**: Support for iOS, Android, and Web (Expo), with native syntax highlighting on all platforms.

## Installation

```bash
npm install react-native-markdown-editor
# or
yarn add react-native-markdown-editor
```

## Usage

### Editor with Toolbar

```tsx
import * as React from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MarkdownTextInput, MarkdownToolbar, useMarkdownEditor } from 'react-native-markdown-editor';

export default function App() {
	const [value, setValue] = React.useState('# Hello World\n\nType your markdown here...');
	const editor = useMarkdownEditor({
		value,
		onChangeText: setValue,
		// Optional: limit enabled features (default: all)
		// features: ['bold', 'italic', 'heading1', 'heading2', 'quote'],
	});

	return (
		<SafeAreaProvider>
			<SafeAreaView style={{ flex: 1 }}>
				<MarkdownToolbar editor={editor} />
				<MarkdownTextInput editor={editor} placeholder="Write markdown..." />
			</SafeAreaView>
		</SafeAreaProvider>
	);
}
```

### Read-Only Renderer

```tsx
import { MarkdownRenderer } from 'react-native-markdown-editor';

function Preview({ markdown }: { markdown: string }) {
	return <MarkdownRenderer markdown={markdown} />;
}
```

### Limiting Enabled Features

By passing `features` to the hook (or directly to `MarkdownRenderer`), only the corresponding features are highlighted/rendered; the rest of the markdown syntax appears as plain text.

```tsx
// Editor: only bold, italic, and heading1 enabled
const editor = useMarkdownEditor({
  value,
  onChangeText: setValue,
  features: ['bold', 'italic', 'heading1'],
});

<MarkdownToolbar editor={editor} />        {/* shows only 3 buttons */}
<MarkdownTextInput editor={editor} />      {/* highlights only bold/italic/h1 */}

// Standalone renderer with the same restrictions
<MarkdownRenderer
  markdown={value}
  features={['bold', 'italic', 'heading1']}
/>
```

## API

### `useMarkdownEditor`

Hook that manages shared state between `MarkdownTextInput` and `MarkdownToolbar`.
Returns a `MarkdownEditorHandle` object to pass as the `editor` prop to both components.

#### Options

| Parameter           | Type                                                                           | Default      | Description                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------ |
| `value`             | `string`                                                                       | **Required** | The current markdown text (controlled).                                                                      |
| `onChangeText`      | `(nextValue: string) => void`                                                  | **Required** | Callback called when the text changes.                                                                       |
| `onSelectionChange` | `(selection: MarkdownSelection) => void`                                       | -            | Optional callback for selection changes.                                                                     |
| `onToolbarAction`   | `(action: MarkdownToolbarAction, result: MarkdownToolbarActionResult) => void` | -            | Callback after each toolbar action.                                                                          |
| `features`          | `MarkdownToolbarAction[]`                                                      | All features | Enabled markdown features. Controls both the toolbar buttons and syntax highlighting in `MarkdownTextInput`. |

#### Return Value (`MarkdownEditorHandle`)

| Property              | Type                            | Description                                                                   |
| --------------------- | ------------------------------- | ----------------------------------------------------------------------------- |
| `features`            | `MarkdownToolbarAction[]`       | Features enabled in the hook.                                                 |
| `value`               | `string`                        | Current text value.                                                           |
| `selection`           | `MarkdownSelection`             | Current selection range.                                                      |
| `activeInlineActions` | `MarkdownInlineToolbarAction[]` | Active inline actions (e.g. bold, italic).                                    |
| `activeImageInfo`     | `MarkdownImageInfo \| null`     | Info about the image under the cursor, `null` otherwise.                      |
| `imageInfo`           | `MarkdownImageInfo \| null`     | Image info set by the toolbar (modal state).                                  |
| `openImageInfo`       | `() => void`                    | Sets `imageInfo` to the current active image.                                 |
| `dismissImageInfo`    | `() => void`                    | Closes the image popup (`imageInfo = null`).                                  |
| `deleteActiveImage`   | `() => void`                    | Removes the markdown image at the current position.                           |
| `highlightedSegments` | `HighlightSegment[]`            | Highlighted segments for live preview.                                        |
| `inputRef`            | `RefObject<TextInput>`          | Ref to the underlying `TextInput` (on web points to `<div contentEditable>`). |

### `MarkdownTextInput`

Input component with live highlighting. Requires `editor`.

| Prop                | Type                   | Default      | Description                                                                                     |
| ------------------- | ---------------------- | ------------ | ----------------------------------------------------------------------------------------------- |
| `editor`            | `MarkdownEditorHandle` | **Required** | Handle returned by `useMarkdownEditor`.                                                         |
| `segmentComponents` | `SegmentComponentMap`  | -            | Override renderers for highlighted segments.                                                    |
| `textInputStyle`    | `TextStyle`            | -            | Style for the inner `TextInput`.                                                                |
| `style`             | `ViewStyle`            | -            | Style for the outer container.                                                                  |
| `...rest`           | `TextInputProps`       | -            | All other `TextInput` props (except `value`, `onChangeText`, `onSelectionChange`, `multiline`). |

### `MarkdownToolbar`

Markdown action toolbar. Can work with `editor` (recommended) or in manual mode.

| Prop                      | Type                                      | Default      | Description                                                                                                   |
| ------------------------- | ----------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------- |
| `editor`                  | `MarkdownEditorHandle`                    | -            | Handle returned by `useMarkdownEditor`. When present, the toolbar uses `editor.features` as the feature list. |
| `features`                | `MarkdownToolbarAction[]`                 | All features | List of features to show (used only in manual mode, without `editor`).                                        |
| `activeInlineActions`     | `MarkdownInlineToolbarAction[]`           | -            | Active inline actions (manual mode only).                                                                     |
| `onPressAction`           | `(action: MarkdownToolbarAction) => void` | -            | Action callback (manual mode only).                                                                           |
| `style`                   | `ViewStyle`                               | -            | Style for the toolbar container.                                                                              |
| `buttonStyle`             | `ViewStyle \| (state) => ViewStyle`       | -            | Style applied to each button (static or function).                                                            |
| `buttonTextStyle`         | `TextStyle \| (state) => TextStyle`       | -            | Text style applied to each button (static or function).                                                       |
| `activeButtonStyle`       | `ViewStyle`                               | -            | Additional style for active buttons.                                                                          |
| `activeButtonTextStyle`   | `TextStyle`                               | -            | Additional text style for active buttons.                                                                     |
| `inactiveButtonStyle`     | `ViewStyle`                               | -            | Additional style for inactive buttons.                                                                        |
| `inactiveButtonTextStyle` | `TextStyle`                               | -            | Additional text style for inactive buttons.                                                                   |
| `renderButton`            | `(params) => ReactNode`                   | -            | Custom renderer for each button.                                                                              |

#### Custom Style Example

```tsx
<MarkdownToolbar
	editor={editor}
	features={['bold', 'italic', 'heading1', 'heading2', 'quote', 'unorderedList']}
	buttonStyle={(state) => ({
		backgroundColor: state.active ? '#007AFF' : '#f0f0f0',
		borderRadius: 6,
	})}
/>
```

### `MarkdownRenderer`

Read-only component for rendering markdown into React Native components.

| Prop         | Type                            | Default      | Description                                                                                                                       |
| ------------ | ------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `markdown`   | `string`                        | **Required** | The markdown string to render.                                                                                                    |
| `components` | `Partial<MarkdownComponentMap>` | -            | Component overrides for specific tags.                                                                                            |
| `style`      | `ViewStyle`                     | -            | Style for the root container.                                                                                                     |
| `features`   | `MarkdownToolbarAction[]`       | -            | Enabled markdown features. When provided, only the corresponding features are rendered; disabled syntax is treated as plain text. |

#### Component Overrides

```tsx
import { MarkdownRenderer } from 'react-native-markdown-editor';
import type { MarkdownComponentProps } from 'react-native-markdown-editor';

const CustomBold = ({ children }: MarkdownComponentProps) => <Text style={{ fontWeight: '900', color: 'red' }}>{children}</Text>;

<MarkdownRenderer markdown="Some **bold** and *italic* text" components={{ bold: CustomBold }} />;
```

### Utilities

| Export                                        | Description                                                                       |
| --------------------------------------------- | --------------------------------------------------------------------------------- |
| `parseMarkdown(markdown, features?)`          | Parses markdown into an array of block nodes (`MarkdownBlockNode[]`).             |
| `parseMarkdownInline(content, features?)`     | Parses inline content into inline nodes (`MarkdownInlineNode[]`).                 |
| `highlightMarkdown(markdown, features?)`      | Converts markdown into semantic segments for live preview (`HighlightSegment[]`). |
| `applyMarkdownToolbarAction(params)`          | Applies a toolbar action to the text and returns the result.                      |
| `DEFAULT_MARKDOWN_FEATURES`                   | Default list of enabled features.                                                 |
| `DEFAULT_SEGMENT_COMPONENTS`                  | Complete map of default segment components.                                       |
| `getDefaultSegmentStyle(type, meta?)`         | Returns the default `TextStyle` for a segment type.                               |
| `isMarkdownFeatureEnabled(features, feature)` | Checks if a markdown feature is enabled based on the features array.              |
| `isHeadingLevelEnabled(features, level)`      | Checks if a specific heading level (1–6) is enabled.                              |

## Architecture

### Source Structure

```
src/
├── index.ts                    # Public re-exports
├── markdownCore.types.ts     # Shared types (AST nodes, component props, editor handle)
│
├── useMarkdownEditor.ts        # Hook: shared state between input and toolbar
├── MarkdownTextInput.tsx        # Editor component with live preview
├── MarkdownToolbar.tsx          # Action toolbar component
│
├── MarkdownRenderer.tsx         # Read-only component for markdown rendering
├── markdownRendererDefaults.tsx  # Default components and styles for the renderer
│
├── markdownParser.ts            # Parser: markdown → AST (block + inline nodes)
├── markdownHighlight.ts         # Highlighter: markdown → semantic segments (for TextInput)
├── markdownHighlight.types.ts   # Types for the highlighting module
│
├── markdownToolbarActions.ts    # Transformation logic for toolbar actions
├── markdownSyntaxUtils.ts       # Shared utilities: escape, token scanning, image parsing
├── markdownSegment.types.ts     # Segment types for TextInput renderers
└── markdownSegmentDefaults.tsx  # Default segment components for TextInput
```

### How It Works

This module uses an advanced technique to ensure real-time highlighting while keeping the editor editable and performant.

#### "Styled Children" Rendering

Unlike approaches based on WebView or complex native libraries, `react-native-markdown-editor` uses the standard React Native system:

1. **Highlighting** (`markdownHighlight.ts`): The markdown text is parsed and split into segments with associated styles. Unlike the AST parser, this module produces flat segments optimized for rendering in the `TextInput`.
2. **Attributed Text**: Instead of passing a flat string to the `TextInput`, segments are passed as `<Text>` children with individual styles.
     ```jsx
     <TextInput>
     	<Text style={styles.heading}># Title</Text>
     	<Text style={styles.body}>Normal text</Text>
     	<Text style={styles.bold}>**Bold**</Text>
     </TextInput>
     ```
3. **Native**: React Native converts these children into native _Attributed Strings_ (on iOS and Android). The operating system handles mixed text rendering, selection, cursor, and input.

#### Web: ContentEditable

On Web, `<TextInput>` is rendered as a `<textarea>` by the DOM, which does not support styled children. To maintain syntax highlighting in the browser as well, `MarkdownTextInput` uses a different approach:

1. **ContentEditable**: A `<div contentEditable>` replaces the `TextInput`. Highlighted segments are converted into `<span>` elements with inline CSS (same colors, fonts, and sizes as native) and injected via `innerHTML`.
2. **Cursor Preservation**: On each DOM update, the cursor position is saved as a text offset (via `TreeWalker`) and restored after the rebuild, ensuring a smooth typing experience.
3. **Input and Paste**: Enter and Paste keys are intercepted to insert plain text (`\n` and clipboard plain text), preventing the browser from inserting unwanted HTML elements.
4. **Programmatic Selection**: Toolbar actions update the selection via `editor.selection`, which is applied to the `contentEditable` via `useEffect`.

#### Parser vs Highlighter

The codebase contains two distinct analysis modules:

| Module                 | Output                               | Usage                             |
| ---------------------- | ------------------------------------ | --------------------------------- |
| `markdownParser.ts`    | Tree AST (`MarkdownBlockNode[]`)     | `MarkdownRenderer` (read-only)    |
| `markdownHighlight.ts` | Flat segments (`HighlightSegment[]`) | `MarkdownTextInput` (live editor) |

Both share low-level utilities in `markdownSyntaxUtils.ts` (escape, token scanning, image URL parsing).

#### Input Handling

- Uses synchronization techniques (`requestAnimationFrame`) to update the native buffer without conflicts.
- On Android, applies specific workarounds to force cursor position after programmatic toolbar actions.
