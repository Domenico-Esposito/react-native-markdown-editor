import * as React from 'react';

import { ReactNativeMarkdownEditorViewProps } from './ReactNativeMarkdownEditor.types';

export default function ReactNativeMarkdownEditorView(props: ReactNativeMarkdownEditorViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
