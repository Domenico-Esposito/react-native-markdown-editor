import { requireNativeView } from 'expo';
import * as React from 'react';

import { ReactNativeMarkdownEditorViewProps } from './ReactNativeMarkdownEditor.types';

const NativeView: React.ComponentType<ReactNativeMarkdownEditorViewProps> =
  requireNativeView('ReactNativeMarkdownEditor');

export default function ReactNativeMarkdownEditorView(props: ReactNativeMarkdownEditorViewProps) {
  return <NativeView {...props} />;
}
