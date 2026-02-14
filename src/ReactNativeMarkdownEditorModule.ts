import { NativeModule, requireNativeModule } from 'expo';

import { ReactNativeMarkdownEditorModuleEvents } from './ReactNativeMarkdownEditor.types';

declare class ReactNativeMarkdownEditorModule extends NativeModule<ReactNativeMarkdownEditorModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ReactNativeMarkdownEditorModule>('ReactNativeMarkdownEditor');
